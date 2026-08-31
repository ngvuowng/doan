import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Header } from '@/components/site/Header'

/** Bọc server-side cho Header: lấy danh mục cho menu và trạng thái đăng nhập. */
export async function SiteHeader() {
  const [categories, user] = await Promise.all([
    prisma.category.findMany({
      where: { kind: 'product' },
      orderBy: { position: 'asc' },
      select: { slug: true, name: true },
    }),
    getCurrentUser(),
  ])

  return (
    <Header
      categories={categories}
      userName={user?.name ?? null}
      isAdmin={user?.role === 'ADMIN'}
    />
  )
}
