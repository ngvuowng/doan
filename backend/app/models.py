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
    JSON,
    Boolean,
    Column,
    Double,
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
    # Danh mục cha (cây nhiều cấp theo menu chính). NULL = danh mục gốc = một mục menu.
    # SET NULL: xoá cha thì con nổi lên thành gốc, không kéo theo mất gán sản phẩm.
    parent_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )

    parent: Mapped["Category | None"] = relationship(back_populates="children", remote_side=[id])
    children: Mapped[list["Category"]] = relationship(
        back_populates="parent", order_by="Category.position"
    )
    products: Mapped[list["Product"]] = relationship(
        secondary=product_categories, back_populates="categories"
    )
    posts: Mapped[list["Post"]] = relationship(
        secondary=post_categories, back_populates="categories"
    )

    __table_args__ = (
        Index("ix_categories_kind", "kind"),
        Index("ix_categories_parent_id", "parent_id"),
    )


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
    # USER (khách hàng) | ADMIN | STORE_MANAGER | CASHIER | SALES. Với nhân viên, vai trò
    # chỉ là chức danh; quyền thật nằm ở `permissions` (xem app/permissions.py).
    role: Mapped[str] = mapped_column(String(20), default="USER")
    # Danh sách khoá quyền quản trị viên tick cho từng tài khoản. Cột JSON không theo dõi
    # thay đổi tại chỗ nên luôn gán list mới, không append.
    permissions: Mapped[list[str]] = mapped_column(JSON, default=list)
    # Cửa hàng nhân viên làm việc; NULL với ADMIN (thấy mọi cửa hàng) và khách hàng.
    # SET NULL: xoá cửa hàng thì nhân viên mất phạm vi đơn hàng, admin phải gán lại.
    store_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("stores.id", ondelete="SET NULL"), nullable=True
    )
    # False = bị khoá (nhân viên nghỉ việc): không đăng nhập được, token đang có vô hiệu ngay.
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(Timestamp, default=utcnow)

    store: Mapped["Store | None"] = relationship()
    orders: Mapped[list["Order"]] = relationship(back_populates="user")

    __table_args__ = (Index("ix_users_store_id", "store_id"),)


class Store(Base):
    """Điểm bán hàng thật; khách chọn một cửa hàng khi thanh toán để tính phí giao."""

    __tablename__ = "stores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(255))
    address: Mapped[str] = mapped_column(String(500))
    # DOUBLE chứ không FLOAT: FLOAT của MySQL chỉ giữ ~7 chữ số, toạ độ sẽ bị lệch.
    lat: Mapped[float] = mapped_column(Double)
    lng: Mapped[float] = mapped_column(Double)
    position: Mapped[int] = mapped_column(Integer, default=0)


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
    # UNPAID | PAID — admin đánh dấu tay khi thấy tiền về (đơn COD giữ UNPAID).
    payment_status: Mapped[str] = mapped_column(String(20), default="UNPAID")
    paid_at: Mapped[datetime | None] = mapped_column(Timestamp, nullable=True)
    # Chỉ đặt cho đơn BANK: quá mốc này mà chưa trả thì đơn tự huỷ.
    payment_expires_at: Mapped[datetime | None] = mapped_column(Timestamp, nullable=True)
    # Mốc đã trừ tồn kho: đặt khi admin nhận tiền (BANK) hoặc đơn hoàn thành (COD); NULL = chưa
    # trừ. Là cờ để trừ đúng một lần và hoàn kho khi huỷ (xem app/inventory.py).
    stock_deducted_at: Mapped[datetime | None] = mapped_column(Timestamp, nullable=True)
    # Cửa hàng giao đơn này. NULL với đơn đặt trước khi có tính năng chọn cửa hàng.
    store_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("stores.id", ondelete="SET NULL"), nullable=True
    )
    # Phí giao hàng chốt lúc đặt (VND); đơn cũ là 0 (trước đây miễn phí).
    shipping_fee: Mapped[int] = mapped_column(Integer, default=0)
    # Khoảng cách khách → cửa hàng (km) dùng để tính phí; NULL khi khách không chia sẻ vị trí.
    distance_km: Mapped[float | None] = mapped_column(Double, nullable=True)
    # Tổng tiền khách phải trả chốt tại thời điểm đặt = tiền hàng + phí giao hàng, đơn vị VND.
    total: Mapped[int] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(Timestamp, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(Timestamp, default=utcnow, onupdate=utcnow)

    user: Mapped[User | None] = relationship(back_populates="orders")
    # Nạp kèm bằng JOIN để mọi truy vấn đơn hiện có (và db.refresh) tự có cửa hàng.
    store: Mapped[Store | None] = relationship(lazy="joined")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_orders_user_id", "user_id"),
        Index("ix_orders_status", "status"),
        Index("ix_orders_store_id", "store_id"),
    )


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


class ChatSession(Base):
    """Một cuộc trò chuyện với trợ lý ảo.

    `client_key` là UUID do trình duyệt tự sinh rồi giữ trong localStorage — nó đóng
    vai trò "vé" nhận lại đúng phiên qua các lần tải trang, kể cả với khách chưa đăng
    nhập. Khách có đăng nhập thì gắn thêm `user_id`; dùng SET NULL để xoá tài khoản
    không kéo theo mất lịch sử hội thoại.
    """

    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    client_key: Mapped[str] = mapped_column(String(64), unique=True)
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    # Băm SHA-256 của IP (muối bằng AUTH_SECRET): đủ để đếm hạn mức mà không lưu IP thật.
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # 120 ký tự đầu của câu hỏi đầu tiên, để trang quản trị liệt kê cho dễ đọc.
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(Timestamp, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(Timestamp, default=utcnow, onupdate=utcnow)

    user: Mapped[User | None] = relationship()
    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )

    __table_args__ = (
        Index("ix_chat_sessions_user_id", "user_id"),
        Index("ix_chat_sessions_ip_hash", "ip_hash"),
        Index("ix_chat_sessions_updated_at", "updated_at"),
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE")
    )
    # Lưu đúng hai giá trị "user"/"model" của Gemini để phát lại lịch sử khỏi phải ánh xạ.
    role: Mapped[str] = mapped_column(String(10))
    content: Mapped[str] = mapped_column(Text)
    # Chủ đề khách chọn khi hỏi (product/advice/storage/recipe). NULL với tin nhắn cũ
    # trước khi có tính năng chọn chủ đề. Lưu ở cả hai dòng của một cặp hỏi–đáp vì câu
    # trả lời cũng được sinh dưới prompt của chủ đề đó.
    mode: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(Timestamp, default=utcnow)

    session: Mapped[ChatSession] = relationship(back_populates="messages")

    __table_args__ = (Index("ix_chat_messages_session_id", "session_id"),)
