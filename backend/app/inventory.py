"""Trừ / hoàn tồn kho theo đơn hàng.

Kho KHÔNG trừ lúc đặt (khách có thể không trả tiền) mà trừ khi tiền đã chắc: admin bấm
"Đã nhận tiền" với đơn chuyển khoản, hoặc đơn chuyển sang COMPLETED. `orders.stock_deducted_at`
là cờ trừ-đúng-một-lần: admin đổi trạng thái tự do (COMPLETED → PENDING → COMPLETED) vẫn
không trừ hai lần; huỷ đơn đã trừ thì hoàn lại và xoá cờ để lần xác nhận sau trừ lại từ đầu.

Các hàm ở đây không commit — router gọi commit như mọi endpoint khác. Ném lỗi trước commit
nghĩa là không có gì được ghi (get_db đóng phiên là bỏ hết thay đổi treo).
"""

from collections import Counter

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Order, Product, utcnow


def out_of_stock_error(message: str, lines: list[dict]) -> HTTPException:
    """400 với cùng một hình dạng detail cho cả lúc đặt hàng lẫn lúc trừ kho. Client nhận ra
    bằng khoá `out_of_stock`, giống quy ước `missing_product_ids` ở create_order."""
    return HTTPException(status.HTTP_400_BAD_REQUEST, {"message": message, "out_of_stock": lines})


def _quantities(order: Order) -> tuple[Counter[str], dict[str, str]]:
    """Gộp số lượng theo product_id (một đơn có thể có hai dòng cùng sản phẩm) kèm tên đã chụp
    để báo lỗi. Bỏ dòng có product_id NULL (sản phẩm đã bị xoá)."""
    needed: Counter[str] = Counter()
    names: dict[str, str] = {}
    for item in order.items:
        if item.product_id is not None:
            needed[item.product_id] += item.quantity
            names[item.product_id] = item.name
    return needed, names


def _lock_products(db: Session, ids: list[str]) -> dict[str, Product]:
    """SELECT ... FOR UPDATE: khoá dòng sản phẩm tới khi commit để hai request xác nhận song
    song không cùng đọc một số tồn rồi làm kho âm."""
    if not ids:
        return {}
    rows = db.execute(select(Product).where(Product.id.in_(ids)).with_for_update()).scalars()
    return {p.id: p for p in rows}


def deduct_stock(db: Session, order: Order) -> None:
    """Trừ kho đúng một lần. Thiếu hàng ở bất kỳ dòng nào → 400, không trừ dòng nào."""
    if order.stock_deducted_at is not None:
        return
    needed, names = _quantities(order)
    products = _lock_products(db, list(needed))
    short = [
        {"product_id": pid, "name": names[pid], "stock": p.stock}
        for pid, p in products.items()
        if p.stock < needed[pid]
    ]
    if short:
        detail = ", ".join(f"{s['name']} (cần {needed[s['product_id']]}, còn {s['stock']})" for s in short)
        raise out_of_stock_error(f"Không đủ tồn kho để xác nhận đơn: {detail}.", short)
    for pid, product in products.items():
        product.stock -= needed[pid]
    order.stock_deducted_at = utcnow()


def restore_stock(db: Session, order: Order) -> None:
    """Hoàn kho cho đơn đã trừ rồi xoá cờ. Không có điều kiện nên không bao giờ thất bại."""
    if order.stock_deducted_at is None:
        return
    needed, _ = _quantities(order)
    for pid, product in _lock_products(db, list(needed)).items():
        product.stock += needed[pid]
    order.stock_deducted_at = None
