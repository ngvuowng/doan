"""Quản lý khách hàng: tìm kiếm, xem lịch sử đơn và khoá/mở khoá tài khoản.

Chỉ ADMIN được vào. Đối xứng với `staff.py`: các endpoint ở đây chỉ chạm tới tài khoản
`role = USER`, id của nhân viên trả 404 như không tồn tại. Không có sửa hồ sơ hay đặt lại
mật khẩu — khách tự quản lý hồ sơ của mình ở trang tài khoản.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.deps import DbSession, admin_user
from app.models import Order, User
from app.routers.orders import expire_unpaid_orders
from app.schemas import (
    CustomerDetail,
    CustomerOut,
    CustomerPage,
    CustomerSummary,
    OrderOut,
    StaffActiveIn,
)

router = APIRouter(
    prefix="/api/admin/customers", tags=["customers"], dependencies=[Depends(admin_user)]
)


def _customer_or_404(db: Session, customer_id: str) -> User:
    user = db.get(User, customer_id)
    if user is None or user.role != "USER":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy khách hàng.")
    return user


def _stats_columns():
    """Số đơn, tổng chi tiêu (bỏ đơn đã huỷ) và lần đặt gần nhất — một định nghĩa duy
    nhất cho cả danh sách lẫn trang chi tiết. Chỉ tính đơn gắn tài khoản; đơn khách vãng
    lai trùng email không được gộp vào."""
    return (
        func.count(Order.id).label("order_count"),
        func.coalesce(
            func.sum(case((Order.status != "CANCELLED", Order.total), else_=0)), 0
        ).label("total_spent"),
        func.max(Order.created_at).label("last_order_at"),
    )


def _summary_fields(user: User, order_count, total_spent, last_order_at) -> dict:
    """Ba trường thống kê không nằm trên model nên gán tay."""
    return {
        **{name: getattr(user, name) for name in CustomerOut.model_fields},
        "order_count": order_count or 0,
        "total_spent": total_spent or 0,
        "last_order_at": last_order_at,
    }


@router.get("", response_model=CustomerPage)
def list_customers(
    db: DbSession,
    q: str | None = Query(default=None, description="tên, email hoặc số điện thoại"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    # Đơn chuyển khoản quá hạn bị huỷ trước để tổng chi tiêu không tính nhầm.
    expire_unpaid_orders(db)

    conditions = [User.role == "USER"]
    if q and q.strip():
        like = f"%{q.strip()}%"
        conditions.append(or_(User.name.like(like), User.email.like(like), User.phone.like(like)))

    total = db.execute(select(func.count()).select_from(User).where(*conditions)).scalar_one()

    # Gom thống kê theo khách trong một subquery rồi LEFT JOIN: cả trang chỉ một truy vấn,
    # khách chưa đặt đơn nào vẫn có mặt (các cột thống kê là NULL).
    stats = (
        select(Order.user_id, *_stats_columns())
        .where(Order.user_id.is_not(None))
        .group_by(Order.user_id)
        .subquery()
    )
    rows = db.execute(
        select(User, stats.c.order_count, stats.c.total_spent, stats.c.last_order_at)
        .outerjoin(stats, stats.c.user_id == User.id)
        .where(*conditions)
        .order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return CustomerPage(
        items=[CustomerSummary(**_summary_fields(*row)) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{customer_id}", response_model=CustomerDetail)
def get_customer(customer_id: str, db: DbSession):
    expire_unpaid_orders(db)
    user = _customer_or_404(db, customer_id)
    order_count, total_spent, last_order_at = db.execute(
        select(*_stats_columns()).where(Order.user_id == user.id)
    ).one()
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
    return CustomerDetail(
        **_summary_fields(user, order_count, total_spent, last_order_at),
        orders=[OrderOut.model_validate(o) for o in orders],
    )


@router.patch("/{customer_id}/active", response_model=CustomerOut)
def set_customer_active(customer_id: str, data: StaffActiveIn, db: DbSession):
    """Khoá hoặc mở khoá. Token đang có của khách bị khoá vô hiệu ngay (deps.py đọc lại
    bảng users mỗi request), đăng nhập lại nhận 403."""
    user = _customer_or_404(db, customer_id)
    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user
