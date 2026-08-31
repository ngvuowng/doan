import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { PRODUCT_CARD_SELECT } from '@/lib/catalog'
import { PageHeader } from '@/components/site/PageHeader'
import { ProductGrid } from '@/components/shop/ProductGrid'

export const metadata: Metadata = { title: 'Tìm kiếm' }

export default async function SearchPage({ searchParams }: PageProps<'/tim-kiem'>) {
  const sp = await searchParams
  const query = (typeof sp.q === 'string' ? sp.q : '').trim()

  // SQLite của Prisma không hỗ trợ `mode: insensitive`; LIKE của SQLite vốn đã
  // không phân biệt hoa/thường với ký tự ASCII.
  const products = query
    ? await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { shortDescription: { contains: query } },
            { description: { contains: query } },
          ],
        },
        select: PRODUCT_CARD_SELECT,
        orderBy: { name: 'asc' },
      })
    : []

  return (
    <>
      <PageHeader title="Tìm kiếm" crumbs={[{ label: 'Tìm kiếm' }]} />

      <div className="container-site py-10">
        {query ? (
          <p className="mb-6 text-sm text-muted">
            Có <strong className="text-ink">{products.length}</strong> kết quả cho từ khoá “
            <strong className="text-ink">{query}</strong>”
          </p>
        ) : (
          <p className="mb-6 text-sm text-muted">Nhập từ khoá vào ô tìm kiếm ở đầu trang.</p>
        )}
        {query && <ProductGrid products={products} />}
      </div>
    </>
  )
}
