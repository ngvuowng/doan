import type { MetadataRoute } from 'next'
import { api } from '@/lib/api'
import { SITE_URL } from '@/lib/site'

// Dữ liệu lấy từ API lúc chạy nên không prerender tĩnh được; sinh theo từng request.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts, categories] = await Promise.all([
    api.products.list(),
    api.posts.list(),
    api.categories.list(),
  ])

  const staticPaths = ['', '/cua-hang', '/tin-tuc', '/gioi-thieu', '/lien-he']

  return [
    ...staticPaths.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: new Date() })),
    ...categories.map((c) => ({
      url: `${SITE_URL}${c.kind === 'product' ? '/danh-muc-san-pham' : '/chuyen-muc'}/${c.slug}`,
      lastModified: new Date(),
    })),
    ...products.items.map((p) => ({ url: `${SITE_URL}/san-pham/${p.slug}`, lastModified: p.updatedAt })),
    ...posts.map((p) => ({ url: `${SITE_URL}/tin-tuc/${p.slug}`, lastModified: p.publishedAt })),
  ]
}
