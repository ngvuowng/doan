from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.deps import DbSession, admin_user, or_404
from app.models import Category, ChatMessage, ChatSession, ContactMessage, Order, Post, Product
from app.schemas import (
    AdminStats,
    ChatMessageOut,
    ChatSessionSummary,
    ChatTranscript,
    ContactOut,
    OrderOut,
    OrderStatusIn,
    PostOut,
    ProductIn,
    ProductOut,
)

# `admin_user` gắn ở cấp router nên mọi endpoint dưới đây — kể cả endpoint thêm
# sau này — đều được bảo vệ: thiếu token → 401, sai quyền → 403.
router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(admin_user)])


def _load_categories(db: Session, ids: list[str]) -> list[Category]:
    if not ids:
        return []
    return list(db.execute(select(Category).where(Category.id.in_(ids))).scalars().all())


def _assert_slug_free(db: Session, slug: str, product_id: str | None) -> None:
    stmt = select(Product).where(Product.slug == slug)
    if product_id:
        stmt = stmt.where(Product.id != product_id)
    if db.execute(stmt).scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Slug này đã được dùng cho sản phẩm khác")


def _assert_sale_price(data: ProductIn) -> None:
    if data.sale_price is not None and data.sale_price >= data.price:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Giá khuyến mãi phải nhỏ hơn giá gốc"
        )


@router.get("/stats", response_model=AdminStats)
def stats(db: DbSession):
    recent = (
        db.execute(
            select(Order).order_by(Order.created_at.desc()).limit(5).options(selectinload(Order.items))
        )
        .scalars()
        .all()
    )
    return AdminStats(
        product_count=db.execute(select(func.count()).select_from(Product)).scalar_one(),
        order_count=db.execute(select(func.count()).select_from(Order)).scalar_one(),
        post_count=db.execute(select(func.count()).select_from(Post)).scalar_one(),
        pending_contact_count=db.execute(
            select(func.count()).select_from(ContactMessage).where(ContactMessage.handled.is_(False))
        ).scalar_one(),
        revenue=db.execute(
            select(func.coalesce(func.sum(Order.total), 0)).where(Order.status != "CANCELLED")
        ).scalar_one(),
        recent_orders=[OrderOut.model_validate(o) for o in recent],
    )


# ---------- Sản phẩm ----------


@router.get("/products", response_model=list[ProductOut])
def list_products(db: DbSession):
    return list(
        db.execute(
            select(Product).order_by(Product.created_at.asc()).options(selectinload(Product.categories))
        )
        .scalars()
        .all()
    )


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: str, db: DbSession):
    return or_404(db.get(Product, product_id), "Không tìm thấy sản phẩm.")


@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductIn, db: DbSession):
    _assert_slug_free(db, data.slug, None)
    _assert_sale_price(data)

    product = Product(
        **data.model_dump(by_alias=False, exclude={"category_ids"}),
        categories=_load_categories(db, data.category_ids),
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: str, data: ProductIn, db: DbSession):
    product = or_404(db.get(Product, product_id), "Không tìm thấy sản phẩm.")

    _assert_slug_free(db, data.slug, product_id)
    _assert_sale_price(data)

    # Bỏ qua `hover_image`: form quản trị không có ô này nên `ProductIn` luôn mang
    # giá trị mặc định None, ghi đè vào sẽ xoá mất ảnh hover đang lưu trong CSDL.
    fields = data.model_dump(by_alias=False, exclude={"category_ids", "hover_image"})
    for field, value in fields.items():
        setattr(product, field, value)
    product.categories = _load_categories(db, data.category_ids)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: str, db: DbSession):
    product = or_404(db.get(Product, product_id), "Không tìm thấy sản phẩm.")
    db.delete(product)
    db.commit()


# ---------- Đơn hàng ----------


@router.get("/orders", response_model=list[OrderOut])
def list_orders(db: DbSession):
    orders = (
        db.execute(
            select(Order).order_by(Order.created_at.desc()).options(selectinload(Order.items))
        )
        .scalars()
        .all()
    )
    return orders


@router.patch("/orders/{order_id}", response_model=OrderOut)
def update_order_status(order_id: str, data: OrderStatusIn, db: DbSession):
    order = or_404(db.get(Order, order_id), "Không tìm thấy đơn hàng.")

    order.status = data.status
    db.commit()
    db.refresh(order)
    return order


# ---------- Bài viết ----------


@router.get("/posts", response_model=list[PostOut])
def list_posts(db: DbSession):
    return list(
        db.execute(
            select(Post).order_by(Post.published_at.desc()).options(selectinload(Post.categories))
        )
        .scalars()
        .all()
    )


# ---------- Tin nhắn liên hệ ----------


@router.get("/contacts", response_model=list[ContactOut])
def list_contacts(db: DbSession):
    return list(
        db.execute(select(ContactMessage).order_by(ContactMessage.created_at.desc())).scalars().all()
    )


@router.patch("/contacts/{message_id}", response_model=ContactOut)
def toggle_contact_handled(message_id: str, db: DbSession):
    message = or_404(db.get(ContactMessage, message_id), "Không tìm thấy tin nhắn.")

    message.handled = not message.handled
    db.commit()
    db.refresh(message)
    return message


# ---------- Hội thoại trợ lý ảo ----------


def _summary_fields(session: ChatSession, message_count: int) -> dict:
    """Ba trường user_name/user_email/message_count không nằm trên model nên gán tay."""
    return {
        "id": session.id,
        "client_key": session.client_key,
        "title": session.title,
        "user_name": session.user.name if session.user else None,
        "user_email": session.user.email if session.user else None,
        "message_count": message_count,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
    }


@router.get("/chats", response_model=list[ChatSessionSummary])
def list_chats(db: DbSession):
    # Đếm bằng subquery thay vì nạp hết tin nhắn của từng phiên chỉ để lấy con số.
    message_count = (
        select(func.count())
        .select_from(ChatMessage)
        .where(ChatMessage.session_id == ChatSession.id)
        .correlate(ChatSession)
        .scalar_subquery()
    )
    rows = db.execute(
        select(ChatSession, message_count)
        .options(selectinload(ChatSession.user))
        .order_by(ChatSession.updated_at.desc())
        .limit(200)
    ).all()
    return [ChatSessionSummary(**_summary_fields(session, count)) for session, count in rows]


@router.get("/chats/{session_id}", response_model=ChatTranscript)
def get_chat(session_id: str, db: DbSession):
    session = or_404(
        db.execute(
            select(ChatSession)
            .where(ChatSession.id == session_id)
            .options(selectinload(ChatSession.user), selectinload(ChatSession.messages))
        ).scalar_one_or_none(),
        "Không tìm thấy cuộc trò chuyện.",
    )
    return ChatTranscript(
        **_summary_fields(session, len(session.messages)),
        messages=[ChatMessageOut.model_validate(m) for m in session.messages],
    )
