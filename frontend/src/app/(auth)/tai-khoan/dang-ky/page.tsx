import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AuthShell } from '@/components/account/AuthShell'
import { RegisterForm } from '@/components/account/AuthForms'

export const metadata: Metadata = { title: 'Đăng ký' }

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/tai-khoan')

  return (
    <AuthShell title="Đăng ký">
      <RegisterForm />
    </AuthShell>
  )
}
