from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from app.deps import DbSession
from app.models import Category, Post, Product, post_categories, product_categories
from app.schemas import CategoryOut, CategoryWithCount

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryWithCount])
def list_categories(db: DbSession, kind: str | None = Query(default=None)):
    """Danh mục kèm số sản phẩm/bài viết — thay cho `_count` của Prisma."""
    product_count = (
        select(func.count())
        .select_from(product_categories)
        .where(product_categories.c.category_id == Category.id)
        .correlate(Category)
        .scalar_subquery()
    )
    post_count = (
        select(func.count())
        .select_from(post_categories)
        .where(post_categories.c.category_id == Category.id)
        .correlate(Category)
        .scalar_subquery()
    )

    stmt = select(Category, product_count, post_count).order_by(Category.position)
    if kind:
        stmt = stmt.where(Category.kind == kind)

    return [
        CategoryWithCount(
            **CategoryOut.model_validate(category).model_dump(by_alias=False),
            product_count=n_products,
            post_count=n_posts,
        )
        for category, n_products, n_posts in db.execute(stmt).all()
    ]


@router.get("/{slug}", response_model=CategoryOut)
def get_category(slug: str, db: DbSession, kind: str | None = Query(default=None)):
    stmt = select(Category).where(Category.slug == slug)
    if kind:
        stmt = stmt.where(Category.kind == kind)

    category = db.execute(stmt).scalar_one_or_none()
    if not category:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy danh mục.")
    return category
