import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProductForm } from '@/components/admin/ProductForm'

export const metadata: Metadata = { title: 'Thêm sản phẩm' }

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { kind: 'product' },
    orderBy: { position: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <>
      <h2 className="mb-4 font-heading text-lg font-bold uppercase">Thêm sản phẩm</h2>
      <div className="rounded-lg border border-line p-5">
        <ProductForm
          categories={categories}
          product={{
            id: null,
            name: '',
            slug: '',
            price: 0,
            salePrice: null,
            stock: 100,
            image: '',
            shortDescription: '',
            description: '',
            categoryIds: [],
          }}
        />
      </div>
    </>
  )
}
