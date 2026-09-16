"""Bộ quyền chi tiết cho nhân viên.

Vai trò (`users.role`) chỉ là chức danh; quyền thực thi là danh sách khoá lưu trong
`users.permissions` của từng tài khoản, do quản trị viên tick chọn. Riêng ADMIN có
toàn quyền, không cần liệt kê. Frontend giữ bản sao cùng bộ khoá này ở
`lib/permissions.ts` (kèm nhãn tiếng Việt và bộ mặc định theo vai trò).
"""

from typing import Literal, get_args

from app.models import User

PermissionKey = Literal[
    "products.view",
    "products.edit",
    "orders.view",
    "orders.update",
    "orders.payment",
    "posts.view",
    "contacts.manage",
    "chats.view",
]
PERMISSIONS: frozenset[str] = frozenset(get_args(PermissionKey))

# Vai trò được phép có trong khu quản trị. "USER" (khách hàng) cố ý không nằm đây.
StaffRole = Literal["ADMIN", "STORE_MANAGER", "CASHIER", "SALES"]


def has_permission(user: User, permission: str) -> bool:
    return user.role == "ADMIN" or permission in user.permissions
