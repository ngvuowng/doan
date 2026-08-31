from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.deps import CurrentUser, DbSession
from app.models import User
from app.schemas import AuthOut, LoginIn, ProfileIn, RegisterIn, UserOut
from app.security import create_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _auth_out(user: User) -> AuthOut:
    return AuthOut(
        token=create_token(user.id, user.email, user.name, user.role),
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=AuthOut)
def login(data: LoginIn, db: DbSession):
    user = db.execute(select(User).where(User.email == data.email)).scalar_one_or_none()
    # Cùng một thông báo cho cả hai trường hợp để không lộ email nào đã đăng ký.
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email hoặc mật khẩu không đúng.")
    return _auth_out(user)


@router.post("/register", response_model=AuthOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterIn, db: DbSession):
    if db.execute(select(User).where(User.email == data.email)).scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email này đã được đăng ký")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _auth_out(user)


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user


@router.patch("/me", response_model=UserOut)
def update_me(data: ProfileIn, user: CurrentUser, db: DbSession):
    user.name = data.name
    user.phone = data.phone or None
    user.address = data.address or None
    db.commit()
    db.refresh(user)
    return user
