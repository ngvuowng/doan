import 'server-only'
import { redirect } from 'next/navigation'
import { api, ApiError, type Profile } from '@/lib/api'
import { can, type Permission } from '@/lib/permissions'
import { clearSessionToken, setSessionToken } from '@/lib/session'

/** Lưu token do backend cấp vào cookie httpOnly sau khi đăng nhập/đăng ký thành công. */
export async function createSession(token: string) {
  await setSessionToken(token)
}

export async function destroySession() {
  await clearSessionToken()
}

/**
 * Đọc người dùng của phiên hiện tại. Trả null nếu chưa đăng nhập, token hỏng/hết hạn,
 * hoặc tài khoản đã bị xoá — backend tự đối chiếu lại CSDL ở `/api/auth/me` nên quyền
 * bị đổi có hiệu lực ngay, không phải chờ token hết hạn.
 */
export async function getCurrentUser(): Promise<Profile | null> {
  try {
    return await api.auth.me()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

/**
 * Người dùng của khu quản trị: khách vãng lai về trang đăng nhập, khách hàng về
 * trang tài khoản. Layout `/admin` đã chặn hai trường hợp này nhưng page render
 * song song với layout trong cùng request nên vẫn phải kiểm lại ở đây.
 */
export async function requireStaff(): Promise<Profile> {
  const user = await getCurrentUser()
  if (!user) redirect('/tai-khoan/dang-nhap')
  if (user.role === 'USER') redirect('/tai-khoan')
  return user
}

/** Nhân viên thiếu quyền bị đưa về trang tổng quan thay vì thấy lỗi 403 từ API. */
export async function requirePermission(permission: Permission): Promise<Profile> {
  const user = await requireStaff()
  if (!can(user, permission)) redirect('/admin')
  return user
}

/** Riêng trang quản lý nhân sự: chỉ ADMIN. */
export async function requireAdmin(): Promise<Profile> {
  const user = await requireStaff()
  if (user.role !== 'ADMIN') redirect('/admin')
  return user
}
