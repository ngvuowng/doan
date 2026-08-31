import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { ProductForm } from '@/components/admin/ProductForm'

export const metadata: Metadata = { title: 'Sửa sản phẩm' }

export default async function EditProductPage({ params }: PageProps<'/admin/san-pham/[id]'>) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    api.admin.product(id),
    api.categories.list('product'),
  ])
  if (!product) notFound()

  return (
    <>
      <h2 className="mb-4 font-heading text-lg font-bold uppercase">Sửa: {product.name}</h2>
      <div className="rounded-lg border border-line p-5">
        <ProductForm
          categories={categories}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            salePrice: product.salePrice,
            stock: product.stock,
            image: product.image,
            shortDescription: product.shortDescription,
            description: product.description,
            categoryIds: product.categories.map((c) => c.id),
          }}
        />
      </div>
    </>
  )
}
