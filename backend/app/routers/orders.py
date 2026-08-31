import secrets

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.deps import CurrentUser, DbSession, OptionalUser
from app.models import Order, OrderItem, Product
from app.schemas import OrderIn, OrderOut

router = APIRouter(prefix="/api/orders", tags=["orders"])


def _generate_code() -> str:
    """Mã đơn ngắn, dễ đọc cho khách, vd. "HL-8F3K2A"."""
    return f"HL-{secrets.token_hex(3).upper()}"


def _to_out(order: Order) -> OrderOut:
    return OrderOut.model_validate(order).model_copy(update={"item_count": len(order.items)})


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(data: OrderIn, db: DbSession, user: OptionalUser):
    ids = [line.product_id for line in data.items]
    products = {
        p.id: p for p in db.execute(select(Product).where(Product.id.in_(ids))).scalars().all()
    }
    if len(products) != len(set(ids)):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Một số sản phẩm không còn tồn tại. Vui lòng kiểm tra lại giỏ hàng.",
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
        total=sum(item.price * item.quantity for item in items),
        items=items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return _to_out(order)


@router.get("", response_model=list[OrderOut])
def my_orders(db: DbSession, user: CurrentUser):
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
    return [_to_out(o) for o in orders]


@router.get("/{code}", response_model=OrderOut)
def get_order(code: str, db: DbSession):
    """Công khai theo mã đơn để khách vãng lai xem được trang cảm ơn.

    Giữ đúng hành vi của bản Next.js cũ. Trang "đơn hàng của tôi" ở frontend vẫn
    tự kiểm tra chủ đơn trước khi hiển thị.
    """
    order = db.execute(
        select(Order).where(Order.code == code).options(selectinload(Order.items))
    ).scalar_one_or_none()
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy đơn hàng.")
    return _to_out(order)
