import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

const COOKIE_NAME = 'halona_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 ngày

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('Thiếu biến môi trường AUTH_SECRET')
  return new TextEncoder().encode(secret)
}

export type SessionUser = {
  id: string
  email: string
  name: string
  role: string
}

/** Ký JWT và đặt vào cookie httpOnly sau khi đăng nhập/đăng ký thành công. */
export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey())

  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/**
 * Đọc người dùng từ cookie phiên. Trả null nếu chưa đăng nhập, token hỏng/hết hạn,
 * hoặc tài khoản đã bị xoá khỏi CSDL.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secretKey())
    if (!payload.sub) return null

    // Đối chiếu lại với CSDL để quyền hạn đổi có hiệu lực ngay, không chờ token hết hạn.
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true },
    })
    return user
  } catch {
    return null
  }
}

/** Dùng cho các trang quản trị: ném lỗi nếu người dùng không phải ADMIN. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new Error('UNAUTHORIZED')
  return user
}
