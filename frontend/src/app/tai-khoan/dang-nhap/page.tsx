import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { PageHeader } from '@/components/site/PageHeader'
import { LoginForm } from '@/components/account/AuthForms'

export const metadata: Metadata = { title: 'Đăng nhập' }

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/tai-khoan')

  return (
    <>
      <PageHeader
        title="Đăng nhập"
        crumbs={[{ label: 'Tài khoản', href: '/tai-khoan' }, { label: 'Đăng nhập' }]}
      />
      <div className="container-site py-10">
        <div className="mx-auto max-w-md rounded-lg border border-line p-6">
          <LoginForm />
          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Tài khoản demo — quản trị: <code>admin@halona.vn</code> / <code>admin123</code>; khách:{' '}
            <code>khachhang@halona.vn</code> / <code>khach123</code>
          </p>
        </div>
      </div>
    </>
  )
}
