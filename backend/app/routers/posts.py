from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.deps import DbSession, or_404
from app.models import Category, Post
from app.schemas import PostCard, PostOut

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("", response_model=list[PostCard])
def list_posts(
    db: DbSession,
    category: str | None = Query(default=None, description="slug chuyên mục"),
    exclude: str | None = Query(default=None, description="slug bài viết cần loại bỏ"),
    limit: int | None = Query(default=None, ge=1, le=100),
):
    """Bài viết không phân trang ở bất kỳ trang nào nên chỉ cần `limit`."""
    stmt = select(Post).order_by(Post.published_at.desc())

    if category:
        stmt = stmt.join(Post.categories).where(Category.slug == category)
    if exclude:
        stmt = stmt.where(Post.slug != exclude)
    if limit:
        stmt = stmt.limit(limit)

    return list(db.execute(stmt).scalars().all())


@router.get("/{slug}", response_model=PostOut)
def get_post(slug: str, db: DbSession):
    post = db.execute(
        select(Post).where(Post.slug == slug).options(selectinload(Post.categories))
    ).scalar_one_or_none()
    return or_404(post, "Không tìm thấy bài viết.")
