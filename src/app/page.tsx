import { prisma } from '@/lib/prisma'
import { HeroSlider } from '@/components/home/HeroSlider'
import { PromoBanners } from '@/components/home/PromoBanners'
import { WideBanners } from '@/components/home/WideBanners'
import { FeatureStrip } from '@/components/home/FeatureStrip'
import { ProductSection } from '@/components/home/ProductSection'
import { BlogSection } from '@/components/home/BlogSection'
import { ContactSection } from '@/components/home/ContactSection'

const PRODUCT_CARD_FIELDS = {
  id: true,
  slug: true,
  name: true,
  price: true,
  salePrice: true,
  image: true,
  hoverImage: true,
} as const

/** Ba danh mục được bản gốc hiển thị thành 3 khối riêng ở trang chủ. */
const HOME_SECTIONS = ['trai-cay-nhap-khau', 'trai-cay-noi-dia', 'nuoc-ep']

export default async function HomePage() {
  const [categories, posts] = await Promise.all([
    prisma.category.findMany({
      where: { slug: { in: HOME_SECTIONS } },
      orderBy: { position: 'asc' },
      include: {
        products: { select: PRODUCT_CARD_FIELDS, orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.post.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 4,
      select: { slug: true, title: true, excerpt: true, image: true, publishedAt: true },
    }),
  ])

  const bySlug = (slug: string) => categories.find((c) => c.slug === slug)
  const [first, second, third] = HOME_SECTIONS.map(bySlug)

  return (
    <>
      <HeroSlider />
      <PromoBanners />

      {first && (
        <ProductSection
          title={first.name}
          subtitle={first.subtitle}
          href={`/danh-muc-san-pham/${first.slug}`}
          products={first.products}
        />
      )}

      <WideBanners />

      {second && (
        <ProductSection
          title={second.name}
          subtitle={second.subtitle}
          href={`/danh-muc-san-pham/${second.slug}`}
          products={second.products}
        />
      )}

      {third && (
        <ProductSection
          title={third.name}
          subtitle={third.subtitle}
          href={`/danh-muc-san-pham/${third.slug}`}
          products={third.products}
          dark
        />
      )}

      <FeatureStrip />
      <BlogSection posts={posts} />
      <ContactSection />
    </>
  )
}
