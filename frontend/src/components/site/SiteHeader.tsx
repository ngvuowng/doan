import { api } from '@/lib/api'
import { buildCategoryTree } from '@/lib/catalog'
import { getCurrentUser } from '@/lib/auth'
import { isStaff } from '@/lib/permissions'
import { Header } from '@/components/site/Header'

/** Bọc server-side cho Header: dựng cây danh mục cho menu và lấy trạng thái đăng nhập. */
export async function SiteHeader() {
  const [categories, user] = await Promise.all([
    api.categories.list('product'),
    getCurrentUser(),
  ])

  return (
    <Header
      categories={buildCategoryTree(categories)}
      userName={user?.name ?? null}
      isStaff={isStaff(user)}
    />
  )
}
