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
    </AuthShell>
  )
}
