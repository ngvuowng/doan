import 'server-only'
import { api, ApiError } from '@/lib/api'
import { clearSessionToken, setSessionToken } from '@/lib/session'

export type SessionUser = {
  id: string
  email: string
  name: string
  role: string
}

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
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const user = await api.auth.me()
    return { id: user.id, email: user.email, name: user.name, role: user.role }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

/** Dùng cho các trang quản trị: ném lỗi nếu người dùng không phải ADMIN. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new Error('UNAUTHORIZED')
  return user
}
