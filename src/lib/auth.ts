import 'server-only'
import { api, ApiError, type Profile } from '@/lib/api'
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
