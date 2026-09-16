/**
 * Bộ quyền chi tiết và vai trò của nhân viên. Bộ khoá phải khớp với
 * backend/app/permissions.py — backend là nơi thực thi, phía này chỉ để ẩn/hiện
 * menu và chặn sớm cho thông báo thân thiện. Không import `server-only` để form
 * quản trị (client) và layout (server) đều dùng được.
 */

export const PERMISSIONS = [
  { key: 'products.view', label: 'Xem sản phẩm' },
  { key: 'products.edit', label: 'Thêm / sửa / xoá sản phẩm' },
  { key: 'orders.view', label: 'Xem đơn hàng của cửa hàng' },
  { key: 'orders.update', label: 'Đổi trạng thái đơn hàng' },
  { key: 'orders.payment', label: 'Xác nhận đã nhận chuyển khoản' },
  { key: 'posts.view', label: 'Xem bài viết' },
  { key: 'contacts.manage', label: 'Xem và xử lý tin nhắn liên hệ' },
  { key: 'chats.view', label: 'Xem hội thoại trợ lý ảo' },
] as const

export type Permission = (typeof PERMISSIONS)[number]['key']

const ALL_PERMISSIONS = PERMISSIONS.map((p) => p.key)

/** Vai trò chỉ là chức danh; `defaults` là bộ quyền tick sẵn khi chọn vai trò trên form. */
export const STAFF_ROLES: readonly {
  value: string
  label: string
  defaults: readonly Permission[]
}[] = [
  { value: 'STORE_MANAGER', label: 'Quản lý cửa hàng', defaults: ALL_PERMISSIONS },
  {
    value: 'CASHIER',
    label: 'Thu ngân',
    defaults: ['orders.view', 'orders.update', 'orders.payment'],
  },
  {
    value: 'SALES',
    label: 'Nhân viên bán hàng',
    defaults: ['products.view', 'orders.view', 'orders.update', 'contacts.manage', 'chats.view'],
  },
  // ADMIN có toàn quyền nên không có bộ mặc định; form khoá các ô tick khi chọn.
  { value: 'ADMIN', label: 'Quản trị viên', defaults: [] },
]

export function roleLabel(role: string): string {
  return STAFF_ROLES.find((r) => r.value === role)?.label ?? role
}

type Grantee = { role: string; permissions: string[] }

/** Mọi tài khoản không phải khách hàng: được vào khu quản trị. */
export function isStaff(user: Grantee | null | undefined): boolean {
  return !!user && user.role !== 'USER'
}

export function can(user: Grantee, permission: Permission): boolean {
  return user.role === 'ADMIN' || user.permissions.includes(permission)
}
