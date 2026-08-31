import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminNav } from '@/components/admin/AdminNav'
import { PageHeader } from '@/components/site/PageHeader'

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const user = await getCurrentUser()
  // Khách vãng lai về trang đăng nhập; người dùng thường không thấy khu quản trị.
  if (!user) redirect('/tai-khoan/dang-nhap')
  if (user.role !== 'ADMIN') redirect('/tai-khoan')

  return (
    <>
      <PageHeader title="Quản trị" crumbs={[{ label: 'Quản trị' }]} />
      <div className="container-site flex flex-col gap-8 py-10 lg:flex-row">
        <AdminNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  )
}
