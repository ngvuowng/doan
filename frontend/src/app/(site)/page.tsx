import { api } from '@/lib/api'
import { HeroSlider } from '@/components/home/HeroSlider'
import { CategoryArches } from '@/components/home/CategoryArches'
import { AboutSection } from '@/components/home/AboutSection'
import { StatsVideo, type Stat } from '@/components/home/StatsVideo'
import { PriceMenu } from '@/components/home/PriceMenu'
import { FaqSection } from '@/components/home/FaqSection'
import { ProductSection } from '@/components/home/ProductSection'
import { BlogSection } from '@/components/home/BlogSection'
import { ContactSection } from '@/components/home/ContactSection'

/** Ba danh mục được bản gốc hiển thị thành 3 khối riêng ở trang chủ. */
const HOME_SECTIONS = ['trai-cay-nhap-khau', 'trai-cay-noi-dia', 'nuoc-ep'] as const
/** Phụ đề vàng phía trên tiêu đề của từng khối sản phẩm (cùng thứ tự HOME_SECTIONS). */
const EYEBROWS = ['Tuyển chọn nhập khẩu', 'Đặc sản vùng miền', 'Tươi mát mỗi ngày']
/** Bảng giá lấy thêm nhóm giỏ quà để đủ 2 nhóm mỗi bên. */
const GIFT_SLUG = 'qua-tang-trai-cay'

export default async function HomePage() {
  const [categories, sections, gifts, all, stores, posts] = await Promise.all([
    api.categories.list('product'),
    // Mỗi khối tối đa 8 sản phẩm (4 gốc + 4 kleverfruits = 2 hàng); trang danh mục mới hiện đủ.
    Promise.all(HOME_SECTIONS.map((slug) => api.products.list({ category: slug, page_size: 8 }))),
    api.products.list({ category: GIFT_SLUG, page_size: 4 }),
    // Chỉ cần tổng số sản phẩm cho dải số liệu.
    api.products.list({ page_size: 1 }),
    api.stores.list(),
    api.posts.list({ limit: 4 }),
  ])

  const [first, second, third] = HOME_SECTIONS.map((slug, i) => {
    const category = categories.find((c) => c.slug === slug)
    return category && { ...category, eyebrow: EYEBROWS[i], products: sections[i].items }
  })

  const gift = categories.find((c) => c.slug === GIFT_SLUG)
  const priceGroups = [first, second, third, gift && { ...gift, products: gifts.items }].flatMap((g) =>
    g ? [{ name: g.name, slug: g.slug, products: g.products }] : [],
  )

  // Danh mục gốc ("Sản phẩm") chỉ là nhóm menu, không tính là một danh mục.
  const subcategories = categories.filter((c) => c.parentId !== null)
  const stats: Stat[] = [
    { value: all.total, label: 'Sản phẩm tuyển chọn' },
    { value: subcategories.length || categories.length, label: 'Danh mục sản phẩm' },
    { value: stores.length, label: 'Cửa hàng trong hệ thống' },
    { value: 2, suffix: 'h', label: 'Giao nhanh nội thành' },
  ]

  return (
    <>
      <HeroSlider />
      <CategoryArches categories={categories} />
      <AboutSection />

      {first && (
        <ProductSection
          eyebrow={first.eyebrow}
          title={first.name}
          subtitle={first.subtitle}
          href={`/danh-muc-san-pham/${first.slug}`}
          products={first.products}
        />
      )}

      <StatsVideo stats={stats} />

      {second && (
        <ProductSection
          eyebrow={second.eyebrow}
          title={second.name}
          subtitle={second.subtitle}
          href={`/danh-muc-san-pham/${second.slug}`}
          products={second.products}
        />
      )}

      <PriceMenu groups={priceGroups} />

      {third && (
        <ProductSection
          eyebrow={third.eyebrow}
          title={third.name}
          subtitle={third.subtitle}
          href={`/danh-muc-san-pham/${third.slug}`}
          products={third.products}
        />
      )}

      <BlogSection posts={posts} />
      <FaqSection />
      <ContactSection />
    </>
  )
}
