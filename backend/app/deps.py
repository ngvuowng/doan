"""Dependency và tiện ích dùng chung cho các router."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import read_token

DbSession = Annotated[Session, Depends(get_db)]

# auto_error=False: thiếu header hay sai lược đồ thì trả None để `optional_user`
# vẫn chạy được; khai báo qua HTTPBearer để Swagger có nút Authorize.
bearer_scheme = HTTPBearer(auto_error=False)
BearerToken = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]


def or_404[T](value: T | None, message: str) -> T:
    """Trả về `value`; None thì ném 404 kèm thông báo tiếng Việt."""
    if value is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, message)
    return value


def _user_from_credentials(
    credentials: HTTPAuthorizationCredentials | None, db: Session
) -> User | None:
    if credentials is None:
        return None
    payload = read_token(credentials.credentials.strip())
    if not payload or not payload.get("sub"):
        return None
    # Đọc lại CSDL mỗi lần thay vì tin payload, để quyền bị đổi hay tài khoản bị
    # xoá có hiệu lực ngay, không phải chờ token hết hạn.
    return db.get(User, payload["sub"])


def optional_user(db: DbSession, credentials: BearerToken = None) -> User | None:
    return _user_from_credentials(credentials, db)


def current_user(db: DbSession, credentials: BearerToken = None) -> User:
    user = _user_from_credentials(credentials, db)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Chưa đăng nhập hoặc phiên đã hết hạn.")
    return user


def admin_user(user: Annotated[User, Depends(current_user)]) -> User:
    if user.role != "ADMIN":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.")
    return user


CurrentUser = Annotated[User, Depends(current_user)]
OptionalUser = Annotated[User | None, Depends(optional_user)]
