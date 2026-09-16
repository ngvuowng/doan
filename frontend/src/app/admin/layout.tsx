import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { can, isStaff } from '@/lib/permissions'
import { AdminNav } from '@/components/admin/AdminNav'
import { PageHeader } from '@/components/site/PageHeader'

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const user = await getCurrentUser()
  // Khách vãng lai về trang đăng nhập; khách hàng không thấy khu quản trị.
  if (!user) redirect('/tai-khoan/dang-nhap')
  if (!isStaff(user)) redirect('/tai-khoan')

  // Menu chỉ hiện những mục nhân viên có quyền; từng trang vẫn tự kiểm lại.
  const links = [
    { href: '/admin', label: 'Tổng quan', show: true },
    { href: '/admin/san-pham', label: 'Sản phẩm', show: can(user, 'products.view') },
    { href: '/admin/don-hang', label: 'Đơn hàng', show: can(user, 'orders.view') },
    { href: '/admin/bai-viet', label: 'Bài viết', show: can(user, 'posts.view') },
    { href: '/admin/lien-he', label: 'Liên hệ', show: can(user, 'contacts.manage') },
    { href: '/admin/tro-ly-ao', label: 'Trợ lý ảo', show: can(user, 'chats.view') },
    { href: '/admin/nhan-su', label: 'Nhân sự', show: user.role === 'ADMIN' },
  ]
    .filter((l) => l.show)
    .map(({ href, label }) => ({ href, label }))

  return (
    <>
      <PageHeader title="Quản trị" crumbs={[{ label: 'Quản trị' }]} />
      <div className="container-site flex flex-col gap-8 py-10 lg:flex-row">
        <AdminNav links={links} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  )
}
