import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Khu vực riêng tư không nên được lập chỉ mục.
      disallow: ['/admin', '/tai-khoan', '/thanh-toan', '/gio-hang', '/dat-hang-thanh-cong'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
