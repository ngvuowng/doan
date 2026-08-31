'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/components/cart/CartProvider'
import { discountPercent, effectivePrice, formatPrice } from '@/lib/format'

export type ProductCardData = {
  id: string
  slug: string
  name: string
  price: number
  salePrice: number | null
  image: string
  hoverImage: string | null
}

/**
 * Card sản phẩm theo bản gốc: badge giảm giá góc trái, ảnh đổi khi rê chuột,
 * giá gạch ngang khi có khuyến mãi, nút "Thêm vào giỏ hàng" bo tròn.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  const { add } = useCart()
  const percent = discountPercent(product.price, product.salePrice)
  const price = effectivePrice(product)

  return (
    <article className="group flex flex-col text-center">
      <div className="relative mb-3 overflow-hidden rounded-md border border-line bg-white">
        {percent !== null && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-sale px-2 py-0.5 text-[11px] font-semibold text-white">
            -{percent}%
          </span>
        )}

        <Link href={`/san-pham/${product.slug}`} className="block">
          <div className="relative aspect-square">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-contain p-3 transition-all duration-500 ${
                product.hoverImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'
              }`}
            />
            {product.hoverImage && (
              <Image
                src={product.hoverImage}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            )}
          </div>
        </Link>
      </div>

      <h3 className="font-sans text-sm font-normal">
        <Link href={`/san-pham/${product.slug}`} className="hover:text-primary">
          {product.name}
        </Link>
      </h3>

      <p className="mt-1 flex items-center justify-center gap-2">
        {product.salePrice !== null && (
          <span className="old-price text-sm text-muted line-through">{formatPrice(product.price)}</span>
        )}
        <span className="font-medium text-primary">{formatPrice(price)}</span>
      </p>

      <button
        type="button"
        onClick={() =>
          add({
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price,
            image: product.image,
          })
        }
        className="mx-auto mt-3 rounded-full border border-line bg-white px-6 py-1.5 text-sm text-ink transition-colors hover:border-primary hover:bg-primary hover:text-white"
      >
        Thêm vào giỏ hàng
      </button>
    </article>
  )
}
