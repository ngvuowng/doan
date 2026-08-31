import { getCurrentUser } from '@/lib/auth'
import { AccountNav } from '@/components/account/AccountNav'
import { PageHeader } from '@/components/site/PageHeader'

/**
 * Bọc khu vực tài khoản. Các trang đăng nhập/đăng ký nằm trong cùng thư mục nhưng
 * tự chuyển hướng khi đã đăng nhập, nên ở đây chỉ dựng khung cho người đã đăng nhập.
 */
export default async function AccountLayout({ children }: LayoutProps<'/tai-khoan'>) {
  const user = await getCurrentUser()

  // Chưa đăng nhập: để từng trang con tự xử lý (dang-nhap / dang-ky render form riêng).
  if (!user) return <>{children}</>

  return (
    <>
      <PageHeader title="Tài khoản" crumbs={[{ label: 'Tài khoản' }]} />
      <div className="container-site flex flex-col gap-8 py-10 lg:flex-row">
        <AccountNav isAdmin={user.role === 'ADMIN'} />
        <div className="flex-1">{children}</div>
      </div>
    </>
  )
}
