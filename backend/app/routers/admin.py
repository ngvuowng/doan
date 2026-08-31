from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.deps import AdminUser, DbSession
from app.models import Category, ContactMessage, Order, Post, Product
from app.schemas import (
    AdminStats,
    ContactOut,
    OrderOut,
    OrderStatusIn,
    PostOut,
    ProductIn,
    ProductOut,
)

# Mọi endpoint dưới đây đều đi qua `admin_user`: thiếu token → 401, sai quyền → 403.
router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[])


def _load_categories(db, ids: list[str]) -> list[Category]:
    if not ids:
        return []
    return list(db.execute(select(Category).where(Category.id.in_(ids))).scalars().all())


@router.get("/stats", response_model=AdminStats)
def stats(db: DbSession, _: AdminUser):
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
        recent_orders=[
            OrderOut.model_validate(o).model_copy(update={"item_count": len(o.items)})
            for o in recent
        ],
    )


# ---------- Sản phẩm ----------


@router.get("/products", response_model=list[ProductOut])
def list_products(db: DbSession, _: AdminUser):
    return list(
        db.execute(
            select(Product).order_by(Product.created_at.asc()).options(selectinload(Product.categories))
        )
        .scalars()
        .all()
    )


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: str, db: DbSession, _: AdminUser):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy sản phẩm.")
    return product


@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductIn, db: DbSession, _: AdminUser):
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
def update_product(product_id: str, data: ProductIn, db: DbSession, _: AdminUser):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy sản phẩm.")

    _assert_slug_free(db, data.slug, product_id)
    _assert_sale_price(data)

    for field, value in data.model_dump(by_alias=False, exclude={"category_ids"}).items():
        setattr(product, field, value)
    product.categories = _load_categories(db, data.category_ids)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: str, db: DbSession, _: AdminUser):
    product = db.get(Product, product_id)
    if product:
        db.delete(product)
        db.commit()


def _assert_slug_free(db, slug: str, product_id: str | None) -> None:
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


# ---------- Đơn hàng ----------


@router.get("/orders", response_model=list[OrderOut])
def list_orders(db: DbSession, _: AdminUser):
    orders = (
        db.execute(
            select(Order).order_by(Order.created_at.desc()).options(selectinload(Order.items))
        )
        .scalars()
        .all()
    )
    return [OrderOut.model_validate(o).model_copy(update={"item_count": len(o.items)}) for o in orders]


@router.patch("/orders/{order_id}", response_model=OrderOut)
def update_order_status(order_id: str, data: OrderStatusIn, db: DbSession, _: AdminUser):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy đơn hàng.")

    order.status = data.status
    db.commit()
    db.refresh(order)
    return OrderOut.model_validate(order).model_copy(update={"item_count": len(order.items)})


# ---------- Bài viết ----------


@router.get("/posts", response_model=list[PostOut])
def list_posts(db: DbSession, _: AdminUser):
    return list(
        db.execute(
            select(Post).order_by(Post.published_at.desc()).options(selectinload(Post.categories))
        )
        .scalars()
        .all()
    )


# ---------- Tin nhắn liên hệ ----------


@router.get("/contacts", response_model=list[ContactOut])
def list_contacts(db: DbSession, _: AdminUser):
    return list(
        db.execute(select(ContactMessage).order_by(ContactMessage.created_at.desc())).scalars().all()
    )


@router.patch("/contacts/{message_id}", response_model=ContactOut)
def toggle_contact_handled(message_id: str, db: DbSession, _: AdminUser):
    message = db.get(ContactMessage, message_id)
    if not message:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy tin nhắn.")

    message.handled = not message.handled
    db.commit()
    db.refresh(message)
    return message
