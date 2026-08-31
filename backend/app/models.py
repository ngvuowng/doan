"""Mô hình dữ liệu, chuyển từ prisma/schema.prisma của bản Next.js + SQLite.

Khác biệt so với bản Prisma:
  - Tên bảng/cột dùng snake_case cho đúng quy ước MySQL (Prisma dùng camelCase).
    Lớp Pydantic sẽ đổi lại thành camelCase khi trả JSON nên frontend không phải sửa.
  - Hai bảng nối nhiều-nhiều được khai báo tường minh (Prisma tự sinh ngầm).
  - Khoá chính giữ nguyên kiểu chuỗi (UUID) để giỏ hàng và các route /admin/san-pham/[id]
    ở frontend không phải đổi kiểu dữ liệu.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.dialects.mysql import DATETIME as MySQLDateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    """UTC nhưng bỏ tzinfo: cột DATETIME của MySQL không lưu múi giờ."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


# DATETIME của MySQL mặc định làm tròn xuống giây. Các bản ghi seed (hoặc hai đơn hàng
# đặt liên tiếp) rơi vào cùng một giây sẽ mất thứ tự khi ORDER BY, nên cần giây lẻ.
Timestamp = MySQLDateTime(fsp=6)


product_categories = Table(
    "product_categories",
    Base.metadata,
    Column("product_id", String(36), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", String(36), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)

post_categories = Table(
    "post_categories",
    Base.metadata,
    Column("post_id", String(36), ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", String(36), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)


class Category(Base):
    """Dùng chung cho danh mục sản phẩm và chuyên mục bài viết, phân biệt bằng `kind`."""

    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    slug: Mapped[str] = mapped_column(String(191), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    kind: Mapped[str] = mapped_column(String(20))  # "product" | "post"
    # Phụ đề hiển thị dưới tiêu đề section ở trang chủ.
    subtitle: Mapped[str | None] = mapped_column(String(500), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    products: Mapped[list["Product"]] = relationship(
        secondary=product_categories, back_populates="categories"
    )
    posts: Mapped[list["Post"]] = relationship(
        secondary=post_categories, back_populates="categories"
    )

    __table_args__ = (Index("ix_categories_kind", "kind"),)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    slug: Mapped[str] = mapped_column(String(191), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    # Giá niêm yết, đơn vị VND (đồng) nên dùng số nguyên.
    price: Mapped[int] = mapped_column(Integer)
    # Giá khuyến mãi; NULL nghĩa là không giảm giá.
    sale_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    image: Mapped[str] = mapped_column(String(500))
    # Ảnh thứ hai hiện khi rê chuột lên card sản phẩm (theo bản gốc).
    hover_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    short_description: Mapped[str] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(Text)
    stock: Mapped[int] = mapped_column(Integer, default=100)

    created_at: Mapped[datetime] = mapped_column(Timestamp, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(Timestamp, default=utcnow, onupdate=utcnow)

    categories: Mapped[list[Category]] = relationship(
        secondary=product_categories, back_populates="products", order_by=Category.position
    )
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    slug: Mapped[str] = mapped_column(String(191), unique=True)
    title: Mapped[str] = mapped_column(String(255))
    excerpt: Mapped[str] = mapped_column(Text)
    # Nội dung HTML lấy nguyên từ RSS feed của site gốc.
    content: Mapped[str] = mapped_column(Text)
    image: Mapped[str] = mapped_column(String(500))
    published_at: Mapped[datetime] = mapped_column(Timestamp)

    categories: Mapped[list[Category]] = relationship(
        secondary=post_categories, back_populates="posts", order_by=Category.position
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(191), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="USER")  # "USER" | "ADMIN"
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(Timestamp, default=utcnow)

    orders: Mapped[list["Order"]] = relationship(back_populates="user")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    # Mã đơn hiển thị cho khách, vd. "HL-8F3K2A".
    code: Mapped[str] = mapped_column(String(30), unique=True)
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    customer_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(30))
    address: Mapped[str] = mapped_column(String(500))
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    payment_method: Mapped[str] = mapped_column(String(20), default="COD")
    # PENDING | CONFIRMED | SHIPPING | COMPLETED | CANCELLED
    status: Mapped[str] = mapped_column(String(20), default="PENDING")
    # Tổng tiền chốt tại thời điểm đặt, đơn vị VND.
    total: Mapped[int] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(Timestamp, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(Timestamp, default=utcnow, onupdate=utcnow)

    user: Mapped[User | None] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_orders_user_id", "user_id"), Index("ix_orders_status", "status"))


class OrderItem(Base):
    """Chụp lại tên/giá tại thời điểm đặt, để đơn cũ không đổi khi sản phẩm đổi giá."""

    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"))
    product_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )

    name: Mapped[str] = mapped_column(String(255))
    price: Mapped[int] = mapped_column(Integer)
    quantity: Mapped[int] = mapped_column(Integer)
    image: Mapped[str] = mapped_column(String(500))

    order: Mapped[Order] = relationship(back_populates="items")
    product: Mapped[Product | None] = relationship(back_populates="order_items")

    __table_args__ = (Index("ix_order_items_order_id", "order_id"),)


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    message: Mapped[str] = mapped_column(Text)
    handled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(Timestamp, default=utcnow)
