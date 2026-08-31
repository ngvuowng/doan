import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { PageHeader } from '@/components/site/PageHeader'
import { RegisterForm } from '@/components/account/AuthForms'

export const metadata: Metadata = { title: 'Đăng ký' }

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/tai-khoan')

  return (
    <>
      <PageHeader
        title="Đăng ký"
        crumbs={[{ label: 'Tài khoản', href: '/tai-khoan' }, { label: 'Đăng ký' }]}
      />
      <div className="container-site py-10">
        <div className="mx-auto max-w-md rounded-lg border border-line p-6">
          <RegisterForm />
        </div>
      </div>
    </>
  )
}
