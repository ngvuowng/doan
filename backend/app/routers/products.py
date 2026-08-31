from fastapi import APIRouter, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.deps import DbSession, or_404
from app.models import Category, Product
from app.schemas import ProductCard, ProductDetail, ProductPage

router = APIRouter(prefix="/api/products", tags=["products"])

# Ánh xạ giá trị `?sap-xep=` trên URL của frontend sang cột sắp xếp.
SORTS = {
    "gia-tang": Product.price.asc(),
    "gia-giam": Product.price.desc(),
    "ten": Product.name.asc(),
}


@router.get("", response_model=ProductPage)
def list_products(
    db: DbSession,
    category: str | None = Query(default=None, description="slug danh mục"),
    q: str | None = Query(default=None, description="từ khoá tìm kiếm"),
    sort: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int | None = Query(default=None, ge=1, le=100),
):
    """Bỏ trống `page_size` thì trả về tất cả — trang tìm kiếm và trang chủ cần vậy."""
    stmt = select(Product)

    if category:
        stmt = stmt.join(Product.categories).where(Category.slug == category)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                Product.name.like(like),
                Product.short_description.like(like),
                Product.description.like(like),
            )
        )

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()

    stmt = stmt.order_by(SORTS.get(sort or "", Product.created_at.asc()))
    if page_size is not None:
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    return ProductPage(
        items=list(db.execute(stmt).scalars().all()),
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{slug}", response_model=ProductDetail)
def get_product(slug: str, db: DbSession):
    product = or_404(
        db.execute(
            select(Product).where(Product.slug == slug).options(selectinload(Product.categories))
        ).scalar_one_or_none(),
        "Không tìm thấy sản phẩm.",
    )

    # Sản phẩm liên quan: cùng danh mục chính, bỏ chính nó, lấy tối đa 4.
    related: list[Product] = []
    if product.categories:
        related = list(
            db.execute(
                select(Product)
                .join(Product.categories)
                .where(Category.id == product.categories[0].id, Product.id != product.id)
                .limit(4)
            )
            .scalars()
            .all()
        )

    return ProductDetail(
        **ProductDetail.model_validate(product).model_dump(by_alias=False, exclude={"related"}),
        related=[ProductCard.model_validate(p) for p in related],
    )
