"""Dependency và tiện ích dùng chung cho các router."""

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import read_token

DbSession = Annotated[Session, Depends(get_db)]


def or_404[T](value: T | None, message: str) -> T:
    """Trả về `value`; None thì ném 404 kèm thông báo tiếng Việt."""
    if value is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, message)
    return value


def _user_from_header(authorization: str | None, db: Session) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    payload = read_token(authorization[7:].strip())
    if not payload or not payload.get("sub"):
        return None
    # Đọc lại CSDL mỗi lần thay vì tin payload, để quyền bị đổi hay tài khoản bị
    # xoá có hiệu lực ngay, không phải chờ token hết hạn.
    return db.get(User, payload["sub"])


def optional_user(
    db: DbSession, authorization: Annotated[str | None, Header()] = None
) -> User | None:
    return _user_from_header(authorization, db)


def current_user(
    db: DbSession, authorization: Annotated[str | None, Header()] = None
) -> User:
    user = _user_from_header(authorization, db)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Chưa đăng nhập hoặc phiên đã hết hạn.")
    return user


def admin_user(user: Annotated[User, Depends(current_user)]) -> User:
    if user.role != "ADMIN":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.")
    return user


CurrentUser = Annotated[User, Depends(current_user)]
OptionalUser = Annotated[User | None, Depends(optional_user)]
