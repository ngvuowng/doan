import secrets
from datetime import timedelta

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session, selectinload

from app.config import PAYMENT_TIMEOUT_MINUTES
from app.deps import CurrentUser, DbSession, OptionalUser, or_404
from app.models import Order, OrderItem, Product, utcnow
from app.schemas import OrderIn, OrderOut

router = APIRouter(prefix="/api/orders", tags=["orders"])


def _generate_code() -> str:
    """Mã đơn ngắn, dễ đọc cho khách, vd. "HL-8F3K2A"."""
    return f"HL-{secrets.token_hex(3).upper()}"


def expire_unpaid_orders(db: Session, code: str | None = None) -> None:
    """Huỷ các đơn chuyển khoản quá hạn mà chưa nhận tiền.

    Không có scheduler; thay vào đó gọi hàm này trước mỗi lần đọc đơn (trang thanh
    toán của khách polling vài giây một lần nên đơn hết hạn được huỷ gần như tức thì).
    Một câu UPDATE có điều kiện nên chạy lặp lại vô hại và không đè lên thao tác admin
    vừa đánh dấu đã trả. Đơn admin đã tự chuyển sang CONFIRMED (không còn PENDING)
    thì không bị đụng tới.
    """
    stmt = (
        update(Order)
        .where(
            Order.payment_method == "BANK",
            Order.payment_status == "UNPAID",
            Order.status == "PENDING",
            Order.payment_expires_at.is_not(None),
            Order.payment_expires_at < utcnow(),
        )
        .values(status="CANCELLED")
    )
    if code is not None:
        stmt = stmt.where(Order.code == code)
    db.execute(stmt)
    db.commit()


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(data: OrderIn, db: DbSession, user: OptionalUser):
    ids = [line.product_id for line in data.items]
    products = {
        p.id: p for p in db.execute(select(Product).where(Product.id.in_(ids))).scalars().all()
    }
    # Giỏ hàng nằm ở localStorage nên có thể chứa sản phẩm đã bị xoá (admin xoá,
    # hoặc chạy lại seed). Trả kèm danh sách id để client tự gỡ khỏi giỏ.
    missing = [pid for pid in dict.fromkeys(ids) if pid not in products]
    if missing:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            {
                "message": "Một số sản phẩm không còn tồn tại. Vui lòng kiểm tra lại giỏ hàng.",
                "missing_product_ids": missing,
            },
        )

    # Giá luôn lấy lại từ CSDL để client không sửa được số tiền.
    items = [
        OrderItem(
            product_id=products[line.product_id].id,
            name=products[line.product_id].name,
            image=products[line.product_id].image,
            price=products[line.product_id].sale_price or products[line.product_id].price,
            quantity=line.quantity,
        )
        for line in data.items
    ]

    order = Order(
        code=_generate_code(),
        user_id=user.id if user else None,
        customer_name=data.customer_name,
        email=data.email,
        phone=data.phone,
        address=data.address,
        note=data.note or None,
        payment_method=data.payment_method,
        # Đơn chuyển khoản được giữ trong một khoảng ngắn để khách quét QR.
        payment_expires_at=(
            utcnow() + timedelta(minutes=PAYMENT_TIMEOUT_MINUTES)
            if data.payment_method == "BANK"
            else None
        ),
        total=sum(item.price * item.quantity for item in items),
        items=items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[OrderOut])
def my_orders(db: DbSession, user: CurrentUser):
    expire_unpaid_orders(db)
    orders = (
        db.execute(
            select(Order)
            .where(Order.user_id == user.id)
            .order_by(Order.created_at.desc())
            .options(selectinload(Order.items))
        )
        .scalars()
        .all()
    )
    return orders


@router.get("/{code}", response_model=OrderOut)
def get_order(code: str, db: DbSession):
    """Công khai theo mã đơn để khách vãng lai xem được trang cảm ơn.

    Giữ đúng hành vi của bản Next.js cũ. Trang "đơn hàng của tôi" ở frontend vẫn
    tự kiểm tra chủ đơn trước khi hiển thị.
    """
    expire_unpaid_orders(db, code)
    order = db.execute(
        select(Order).where(Order.code == code).options(selectinload(Order.items))
    ).scalar_one_or_none()
    return or_404(order, "Không tìm thấy đơn hàng.")
