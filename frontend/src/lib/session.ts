import 'server-only'
import { cookies } from 'next/headers'

/**
 * Cookie chứa JWT do backend cấp. Tách riêng khỏi `auth.ts` và `api.ts` để hai
 * file đó không phải import lẫn nhau.
 */
const COOKIE_NAME = 'halona_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 ngày, khớp hạn token của backend

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(COOKIE_NAME)?.value ?? null
}

/**
 * `persistent = false` (bỏ tick "Nhớ tôi") ghi cookie phiên — không có maxAge nên trình
 * duyệt tự xoá khi đóng. Token bên trong vẫn có hạn 7 ngày do backend đặt.
 */
export async function setSessionToken(token: string, persistent = true) {
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(persistent && { maxAge: MAX_AGE_SECONDS }),
  })
}

export async function clearSessionToken() {
  ;(await cookies()).delete(COOKIE_NAME)
}
