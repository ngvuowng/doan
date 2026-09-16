"""Quản lý nhân sự: tạo tài khoản nhân viên, phân quyền, khoá khi nghỉ việc.

Chỉ ADMIN được vào. Các endpoint ở đây không bao giờ chạm tới tài khoản khách hàng
(`role = USER`): id của khách trả 404 như không tồn tại, và `StaffRole` không có
giá trị USER nên không thể biến nhân viên thành khách hay ngược lại.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.deps import DbSession, admin_user
from app.models import Store, User
from app.schemas import StaffActiveIn, StaffCreateIn, StaffOut, StaffPasswordIn, StaffUpdateIn
from app.security import hash_password

router = APIRouter(
    prefix="/api/admin/staff", tags=["staff"], dependencies=[Depends(admin_user)]
)

AdminUser = Annotated[User, Depends(admin_user)]


def _staff_or_404(db: Session, staff_id: str) -> User:
    user = db.get(User, staff_id)
    if user is None or user.role == "USER":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy nhân viên.")
    return user


def _assert_not_self(admin: User, staff: User) -> None:
    """Không cho tự khoá hay tự hạ quyền: tránh tự khoá mình khỏi hệ thống."""
    if admin.id == staff.id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Không thể tự đổi quyền hoặc khoá tài khoản của chính mình.",
        )


def _apply_role(db: Session, user: User, data: StaffUpdateIn) -> None:
    """Gán vai trò, cửa hàng và quyền theo quy tắc: ADMIN toàn quyền nên không gắn gì."""
    user.name = data.name
    user.phone = data.phone or None
    user.role = data.role
    if data.role == "ADMIN":
        user.store = None
        user.permissions = []
        return
    if not data.store_id:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Nhân viên phải thuộc một cửa hàng."
        )
    store = db.get(Store, data.store_id)
    if store is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Cửa hàng không hợp lệ.")
    user.store = store
    # Bỏ trùng nhưng giữ thứ tự tick; luôn gán list mới vì cột JSON không theo dõi sửa tại chỗ.
    user.permissions = list(dict.fromkeys(data.permissions))


@router.get("", response_model=list[StaffOut])
def list_staff(db: DbSession):
    return list(
        db.execute(
            select(User)
            .where(User.role != "USER")
            .order_by(User.created_at.asc())
            .options(selectinload(User.store))
        )
        .scalars()
        .all()
    )


@router.post("", response_model=StaffOut, status_code=status.HTTP_201_CREATED)
def create_staff(data: StaffCreateIn, db: DbSession):
    if db.execute(select(User).where(User.email == data.email)).scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email này đã được đăng ký")

    user = User(email=data.email, password_hash=hash_password(data.password))
    _apply_role(db, user, data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{staff_id}", response_model=StaffOut)
def get_staff(staff_id: str, db: DbSession):
    return _staff_or_404(db, staff_id)


@router.put("/{staff_id}", response_model=StaffOut)
def update_staff(staff_id: str, data: StaffUpdateIn, db: DbSession, admin: AdminUser):
    user = _staff_or_404(db, staff_id)
    _assert_not_self(admin, user)
    _apply_role(db, user, data)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{staff_id}/active", response_model=StaffOut)
def set_staff_active(staff_id: str, data: StaffActiveIn, db: DbSession, admin: AdminUser):
    """Khoá (nghỉ việc) hoặc mở khoá. Token đang có của người bị khoá vô hiệu ngay."""
    user = _staff_or_404(db, staff_id)
    _assert_not_self(admin, user)
    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user


@router.post("/{staff_id}/password", status_code=status.HTTP_204_NO_CONTENT)
def reset_staff_password(staff_id: str, data: StaffPasswordIn, db: DbSession):
    user = _staff_or_404(db, staff_id)
    user.password_hash = hash_password(data.password)
    db.commit()
