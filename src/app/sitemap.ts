import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { SITE_URL } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts, categories] = await Promise.all([
    prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.post.findMany({ select: { slug: true, publishedAt: true } }),
    prisma.category.findMany({ select: { slug: true, kind: true } }),
  ])

  const staticPaths = ['', '/cua-hang', '/tin-tuc', '/gioi-thieu', '/lien-he']

  return [
    ...staticPaths.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: new Date() })),
    ...categories.map((c) => ({
      url: `${SITE_URL}${c.kind === 'product' ? '/danh-muc-san-pham' : '/chuyen-muc'}/${c.slug}`,
      lastModified: new Date(),
    })),
    ...products.map((p) => ({ url: `${SITE_URL}/san-pham/${p.slug}`, lastModified: p.updatedAt })),
    ...posts.map((p) => ({ url: `${SITE_URL}/tin-tuc/${p.slug}`, lastModified: p.publishedAt })),
  ]
}
