import { prisma } from '@/lib/prisma'

export const POST_CARD_SELECT = {
  slug: true,
  title: true,
  excerpt: true,
  image: true,
  publishedAt: true,
} as const

/** Dữ liệu dùng chung cho sidebar của khu vực tin tức. */
export function getSidebarData() {
  return Promise.all([
    prisma.category.findMany({
      where: { kind: 'post' },
      orderBy: { position: 'asc' },
      select: { slug: true, name: true, _count: { select: { posts: true } } },
    }),
    prisma.post.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 4,
      select: { slug: true, title: true },
    }),
  ])
}
