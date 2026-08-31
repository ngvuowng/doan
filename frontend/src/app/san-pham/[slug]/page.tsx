import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { discountPercent, effectivePrice, formatPrice } from '@/lib/format'
import { PageHeader } from '@/components/site/PageHeader'
import { AddToCartForm } from '@/components/shop/AddToCartForm'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { CheckIcon } from '@/components/site/icons'

export async function generateStaticParams() {
  const { items } = await api.products.list()
  return items.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<'/san-pham/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const product = await api.products.get(slug)
  if (!product) return {}
  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: { images: [product.image] },
  }
}

export default async function ProductPage({ params }: PageProps<'/san-pham/[slug]'>) {
  const { slug } = await params
  const product = await api.products.get(slug)
  if (!product) notFound()

  const percent = discountPercent(product.price, product.salePrice)
  const price = effectivePrice(product)
  const mainCategory = product.categories[0]
  const related = product.related

  return (
    <>
      <PageHeader
        title={product.name}
        crumbs={[
          { label: 'Cửa hàng', href: '/cua-hang' },
          ...(mainCategory
            ? [{ label: mainCategory.name, href: `/danh-muc-san-pham/${mainCategory.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="container-site py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-lg border border-line bg-white">
            {percent !== null && (
              <span className="absolute left-3 top-3 z-10 rounded-full bg-sale px-2.5 py-1 text-xs font-semibold text-white">
                -{percent}%
              </span>
            )}
            <div className="relative aspect-square">
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-6"
              />
            </div>
          </div>

          <div>
            <h1 className="font-heading text-3xl font-bold">{product.name}</h1>

            <div className="mt-4 flex items-baseline gap-3">
              {product.salePrice !== null && (
                <span className="text-lg text-muted line-through">{formatPrice(product.price)}</span>
              )}
              <span className="font-heading text-3xl font-bold text-primary">
                {formatPrice(price)}
              </span>
            </div>

            <p className="mt-4 text-muted">{product.shortDescription}</p>

            <ul className="my-6 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-primary" />
                {product.stock > 0 ? `Còn hàng (${product.stock} kg)` : 'Tạm hết hàng'}
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-primary" />
                Giao hàng nội thành TP. HCM trong 2 giờ
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-primary" />
                Đổi trả trong 24h nếu sản phẩm không tươi
              </li>
            </ul>

            <AddToCartForm
              stock={product.stock}
              line={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price,
                image: product.image,
              }}
            />

            {product.categories.length > 0 && (
              <p className="mt-6 text-sm text-muted">
                Danh mục:{' '}
                {product.categories.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && ', '}
                    <Link href={`/danh-muc-san-pham/${c.slug}`} className="text-primary hover:underline">
                      {c.name}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>

        <section className="mt-12 border-t border-line pt-8">
          <h2 className="mb-4 font-heading text-xl font-bold uppercase">Mô tả sản phẩm</h2>
          <div className="rich-text" dangerouslySetInnerHTML={{ __html: product.description }} />
        </section>

        {related.length > 0 && (
          <section className="mt-12 border-t border-line pt-8">
            <h2 className="mb-6 font-heading text-xl font-bold uppercase">Sản phẩm liên quan</h2>
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </>
  )
}
