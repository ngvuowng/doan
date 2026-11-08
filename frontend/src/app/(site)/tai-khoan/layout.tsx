import { getCurrentUser } from '@/lib/auth'
import { isStaff } from '@/lib/permissions'
import { AccountNav } from '@/components/account/AccountNav'
import { PageHeader } from '@/components/site/PageHeader'

/**
 * Bọc khu vực tài khoản cho người đã đăng nhập. Trang đăng nhập/đăng ký cùng URL
 * `/tai-khoan/...` nhưng nằm ở nhóm `app/(auth)/` nên không đi qua layout này.
 */
export default async function AccountLayout({ children }: LayoutProps<'/tai-khoan'>) {
  const user = await getCurrentUser()

  // Chưa đăng nhập: để từng trang con tự chuyển hướng về trang đăng nhập.
  if (!user) return <>{children}</>

  return (
    <>
      <PageHeader title="Tài khoản" crumbs={[{ label: 'Tài khoản' }]} />
      <div className="container-site flex flex-col gap-8 py-10 lg:flex-row">
        <AccountNav isStaff={isStaff(user)} />
        <div className="flex-1">{children}</div>
      </div>
    </>
  )
}
