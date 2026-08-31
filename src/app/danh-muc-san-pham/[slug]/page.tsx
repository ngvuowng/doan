import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { PAGE_SIZE, parsePage } from '@/lib/catalog'
import { PageHeader } from '@/components/site/PageHeader'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { SortSelect } from '@/components/shop/SortSelect'
import { Pagination } from '@/components/shop/Pagination'
import { CategorySidebar } from '@/components/shop/CategorySidebar'

export async function generateStaticParams() {
  const categories = await api.categories.list('product')
  return categories.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/danh-muc-san-pham/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const category = await api.categories.get(slug, 'product')
  if (!category) return {}
  return { title: category.name, description: category.subtitle ?? undefined }
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<'/danh-muc-san-pham/[slug]'>) {
  const { slug } = await params
  const sp = await searchParams
  const sort = typeof sp['sap-xep'] === 'string' ? sp['sap-xep'] : undefined
  const page = parsePage(typeof sp.trang === 'string' ? sp.trang : undefined)

  const category = await api.categories.get(slug, 'product')
  if (!category) notFound()

  const [categories, { items: products, total }] = await Promise.all([
    api.categories.list('product'),
    api.products.list({ category: slug, sort, page, page_size: PAGE_SIZE }),
  ])

  return (
    <>
      <PageHeader
        title={category.name}
        crumbs={[{ label: 'Cửa hàng', href: '/cua-hang' }, { label: category.name }]}
      />

      <div className="container-site flex flex-col gap-8 py-10 lg:flex-row">
        <CategorySidebar categories={categories} activeSlug={category.slug} />

        <div className="flex-1">
          {category.subtitle && <p className="mb-5 text-muted">{category.subtitle}</p>}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <p className="text-sm text-muted">
              Hiển thị {products.length} trên {total} sản phẩm
            </p>
            <SortSelect />
          </div>

          <ProductGrid products={products} />
          <Pagination
            page={page}
            totalPages={Math.ceil(total / PAGE_SIZE)}
            basePath={`/danh-muc-san-pham/${category.slug}`}
            params={{ 'sap-xep': sort }}
          />
        </div>
      </div>
    </>
  )
}
