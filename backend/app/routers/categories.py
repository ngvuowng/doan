from collections import defaultdict

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.deps import DbSession, or_404
from app.models import Category, post_categories, product_categories
from app.schemas import CategoryOut, CategoryWithCount

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryWithCount])
def list_categories(db: DbSession, kind: str | None = Query(default=None)):
    """Danh mục kèm số sản phẩm/bài viết — thay cho `_count` của Prisma."""
    post_count = (
        select(func.count())
        .select_from(post_categories)
        .where(post_categories.c.category_id == Category.id)
        .correlate(Category)
        .scalar_subquery()
    )

    stmt = select(Category, post_count).order_by(Category.position)
    if kind:
        stmt = stmt.where(Category.kind == kind)
    rows = db.execute(stmt).all()

    # product_count = số sản phẩm KHÁC NHAU gán vào chính danh mục hoặc bất kỳ con cháu nào
    # (sâu tuỳ ý). Lấy bảng nối một lần rồi gom trong Python: mỗi cặp (danh mục, sản phẩm)
    # được ghi cho danh mục đó và mọi tổ tiên của nó; dùng set nên không đếm trùng.
    parent_of = {category.id: category.parent_id for category, _ in rows}
    products_of: dict[str, set[str]] = defaultdict(set)
    for category_id, product_id in db.execute(
        select(product_categories.c.category_id, product_categories.c.product_id)
    ):
        node: str | None = category_id
        while node is not None:
            products_of[node].add(product_id)
            node = parent_of.get(node)

    return [
        CategoryWithCount(
            **CategoryOut.model_validate(category).model_dump(by_alias=False),
            product_count=len(products_of[category.id]),
            post_count=n_posts,
        )
        for category, n_posts in rows
    ]


@router.get("/{slug}", response_model=CategoryOut)
def get_category(slug: str, db: DbSession, kind: str | None = Query(default=None)):
    stmt = select(Category).where(Category.slug == slug)
    if kind:
        stmt = stmt.where(Category.kind == kind)

    return or_404(db.execute(stmt).scalar_one_or_none(), "Không tìm thấy danh mục.")
