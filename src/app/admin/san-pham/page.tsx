import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/format'
import { deleteProduct } from '@/actions/admin'

export const metadata: Metadata = { title: 'Quản lý sản phẩm' }

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'asc' },
    include: { categories: { select: { name: true } } },
  })

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold uppercase">Sản phẩm ({products.length})</h2>
        <Link href="/admin/san-pham/moi" className="btn-primary">
          + Thêm sản phẩm
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-shell text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Sản phẩm</th>
              <th className="px-4 py-3 font-medium">Danh mục</th>
              <th className="px-4 py-3 font-medium">Giá</th>
              <th className="px-4 py-3 font-medium">Tồn kho</th>
              <th className="px-4 py-3 text-right font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-line">
                      <Image src={p.image} alt={p.name} fill sizes="48px" className="object-contain p-1" />
                    </div>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted">/{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {p.categories.map((c) => c.name).join(', ') || '—'}
                </td>
                <td className="px-4 py-3">
                  {p.salePrice !== null ? (
                    <>
                      <span className="text-muted line-through">{formatPrice(p.price)}</span>{' '}
                      <span className="font-medium text-primary">{formatPrice(p.salePrice)}</span>
                    </>
                  ) : (
                    <span className="font-medium">{formatPrice(p.price)}</span>
                  )}
                </td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/san-pham/${p.id}`}
                      className="rounded-md border border-line px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
                    >
                      Sửa
                    </Link>
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-line px-3 py-1.5 text-xs hover:border-sale hover:text-sale"
                      >
                        Xoá
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
