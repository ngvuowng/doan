import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AuthShell } from '@/components/account/AuthShell'
import { LoginForm } from '@/components/account/AuthForms'

export const metadata: Metadata = { title: 'Đăng nhập' }

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/tai-khoan')

  return (
    <AuthShell title="Đăng nhập">
      <LoginForm />
      <p className="mt-6 border-t border-white/20 pt-4 text-xs leading-relaxed text-white/75">
        Tài khoản demo — quản trị: <code>admin@halona.vn</code> / <code>admin123</code>; khách:{' '}
        <code>khachhang@halona.vn</code> / <code>khach123</code>
      </p>
    </AuthShell>
  )
}
