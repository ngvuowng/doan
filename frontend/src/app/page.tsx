import { api } from '@/lib/api'
import { HeroSlider } from '@/components/home/HeroSlider'
import { PromoBanners } from '@/components/home/PromoBanners'
import { WideBanners } from '@/components/home/WideBanners'
import { FeatureStrip } from '@/components/home/FeatureStrip'
import { ProductSection } from '@/components/home/ProductSection'
import { BlogSection } from '@/components/home/BlogSection'
import { ContactSection } from '@/components/home/ContactSection'

/** Ba danh mục được bản gốc hiển thị thành 3 khối riêng ở trang chủ. */
const HOME_SECTIONS = ['trai-cay-nhap-khau', 'trai-cay-noi-dia', 'nuoc-ep'] as const

export default async function HomePage() {
  const [categories, sections, posts] = await Promise.all([
    api.categories.list('product'),
    Promise.all(HOME_SECTIONS.map((slug) => api.products.list({ category: slug }))),
    api.posts.list({ limit: 4 }),
  ])

  const [first, second, third] = HOME_SECTIONS.map((slug, i) => {
    const category = categories.find((c) => c.slug === slug)
    return category && { ...category, products: sections[i].items }
  })

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
