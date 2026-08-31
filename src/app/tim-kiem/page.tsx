import type { Metadata } from 'next'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/site/PageHeader'
import { ProductGrid } from '@/components/shop/ProductGrid'

export const metadata: Metadata = { title: 'Tìm kiếm' }

export default async function SearchPage({ searchParams }: PageProps<'/tim-kiem'>) {
  const sp = await searchParams
  const query = (typeof sp.q === 'string' ? sp.q : '').trim()

  // Đối chiếu utf8mb4_unicode_ci của MySQL bỏ qua cả hoa/thường lẫn dấu, nên
  // gõ "tao" cũng ra "Táo nhập khẩu".
  const products = query ? (await api.products.list({ q: query, sort: 'ten' })).items : []

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
