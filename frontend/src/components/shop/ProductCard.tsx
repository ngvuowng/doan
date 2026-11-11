'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/components/cart/CartProvider'
import { discountPercent, effectivePrice, formatPrice } from '@/lib/format'
import { CartIcon } from '@/components/site/icons'

export type ProductCardData = {
  id: string
  slug: string
  name: string
  price: number
  salePrice: number | null
  image: string
  hoverImage: string | null
  stock: number
}

/**
 * Card sản phẩm kiểu mẫu Bean: viền mảnh bo 10px, ảnh vuông trên nền kem (ảnh đổi khi rê chuột),
 * vạch vàng mờ dưới ảnh, badge giảm giá góc dưới trái ảnh; hàng dưới gồm giá và nút giỏ vuông vàng.
 * Nút chỉ có icon nên chữ "Thêm vào giỏ hàng" nằm trong `sr-only` (trình đọc màn hình và e2e dùng).
 * Hết hàng: badge góc phải và nút bị khoá — backend cũng từ chối đặt nếu giỏ cũ còn giữ.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  const { add } = useCart()
  const percent = discountPercent(product.price, product.salePrice)
  const price = effectivePrice(product)
  const soldOut = product.stock <= 0
  const label = soldOut ? 'Hết hàng' : 'Thêm vào giỏ hàng'

  return (
    <article className="group flex flex-col overflow-hidden rounded-[10px] bg-white ring-1 ring-line transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgb(16_43_42/0.45)]">
      <div className="product-frame relative">
        {percent !== null && (
          <span className="absolute bottom-2.5 left-2.5 z-10 rounded-[5px] bg-sale px-1.5 py-0.5 text-[11px] font-semibold text-white">
            -{percent}%
          </span>
        )}
        {soldOut && (
          <span className="absolute right-2.5 top-2.5 z-10 rounded-[5px] bg-ink/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            Hết hàng
          </span>
        )}

        <Link href={`/san-pham/${product.slug}`} className="block" tabIndex={-1} aria-hidden>
          <div className="relative aspect-square">
            {/* Khung lùi vào để lộ nền product-frame và bo góc ảnh. Ảnh là ảnh chụp tràn khung (nhiều
                tỉ lệ khác nhau) nên dùng object-cover cắt vừa ô vuông. */}
            <div className="absolute inset-3 overflow-hidden rounded-lg sm:inset-4">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`object-cover transition-all duration-500 ${
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
                  className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              )}
            </div>
          </div>
        </Link>
        {/* Vạch vàng mờ ngăn ảnh với phần chữ. */}
        <span
          aria-hidden
          className="absolute inset-x-4 bottom-0 h-0.5 bg-[linear-gradient(90deg,transparent,rgb(192_147_66/0.6),transparent)]"
        />
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <h3 className="line-clamp-2 min-h-[2.6em] font-sans text-[13px] leading-[1.3] font-medium sm:text-[15px]">
          <Link href={`/san-pham/${product.slug}`} className="transition-colors hover:text-gold-ink">
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto grid grid-cols-[1fr_auto] items-end gap-2 pt-2">
          <p className="min-w-0 leading-none">
            {product.salePrice !== null && (
              <span className="old-price mb-1 block text-xs text-muted line-through">{formatPrice(product.price)}</span>
            )}
            <span className="text-sm font-bold text-sale sm:text-base">{formatPrice(price)}</span>
          </p>

          <button
            type="button"
            disabled={soldOut}
            title={label}
            onClick={() =>
              add({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price,
                image: product.image,
              })
            }
            className="grid h-9 w-9 place-items-center rounded-md bg-accent text-primary-dark transition-colors enabled:hover:bg-primary enabled:hover:text-white disabled:cursor-not-allowed disabled:bg-line disabled:text-muted sm:h-10 sm:w-10"
          >
            <CartIcon className="h-[18px] w-[18px]" />
            <span className="sr-only">{label}</span>
          </button>
        </div>
      </div>
    </article>
  )
}
