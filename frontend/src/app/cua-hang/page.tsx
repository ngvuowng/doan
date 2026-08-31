import type { Metadata } from 'next'
import { api } from '@/lib/api'
import { PAGE_SIZE, parsePage } from '@/lib/catalog'
import { PageHeader } from '@/components/site/PageHeader'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { SortSelect } from '@/components/shop/SortSelect'
import { Pagination } from '@/components/shop/Pagination'
import { CategorySidebar } from '@/components/shop/CategorySidebar'

export const metadata: Metadata = {
  title: 'Cửa hàng',
  description: 'Toàn bộ sản phẩm nông sản, trái cây tươi sạch tại Halona Fruits.',
}

export default async function ShopPage({ searchParams }: PageProps<'/cua-hang'>) {
  const sp = await searchParams
  const sort = typeof sp['sap-xep'] === 'string' ? sp['sap-xep'] : undefined
  const page = parsePage(typeof sp.trang === 'string' ? sp.trang : undefined)

  const [categories, { items: products, total }] = await Promise.all([
    api.categories.list('product'),
    api.products.list({ sort, page, page_size: PAGE_SIZE }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <PageHeader title="Cửa hàng" crumbs={[{ label: 'Cửa hàng' }]} />

      <div className="container-site flex flex-col gap-8 py-10 lg:flex-row">
        <CategorySidebar categories={categories} />

        <div className="flex-1">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <p className="text-sm text-muted">
              Hiển thị {products.length} trên {total} sản phẩm
            </p>
            <SortSelect />
          </div>

          <ProductGrid products={products} />
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/cua-hang"
            params={{ 'sap-xep': sort }}
          />
        </div>
      </div>
    </>
  )
}
