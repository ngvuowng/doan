'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/components/cart/CartProvider'
import { formatPrice } from '@/lib/format'
import { CartIcon, TrashIcon, XIcon } from '@/components/site/icons'

/** Ngăn kéo giỏ hàng trượt từ phải, mở khi bấm icon giỏ hoặc khi thêm sản phẩm. */
export function CartDrawer() {
  const { items, subtotal, isOpen, closeCart, setQuantity, remove } = useCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={closeCart}
        aria-label="Đóng giỏ hàng"
      />

      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
        role="dialog"
        aria-label="Giỏ hàng"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-heading text-lg font-bold uppercase">Giỏ hàng</h2>
          <button type="button" onClick={closeCart} aria-label="Đóng giỏ hàng" className="p-1">
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <CartIcon className="h-12 w-12 text-line" />
            <p className="text-muted">Chưa có sản phẩm trong giỏ hàng.</p>
            <Link href="/cua-hang" onClick={closeCart} className="btn-primary">
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((line) => (
                <li key={line.productId} className="flex gap-3 py-4">
                  <Link
                    href={`/san-pham/${line.slug}`}
                    onClick={closeCart}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-line bg-white"
                  >
                    <Image
                      src={line.image}
                      alt={line.name}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/san-pham/${line.slug}`}
                      onClick={closeCart}
                      className="line-clamp-2 text-sm font-medium hover:text-primary"
                    >
                      {line.name}
                    </Link>
                    <span className="mt-0.5 text-sm text-primary">{formatPrice(line.price)}</span>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-md border border-line">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.productId, line.quantity - 1)}
                          className="h-7 w-7 text-muted hover:text-primary"
                          aria-label={`Giảm số lượng ${line.name}`}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.productId, line.quantity + 1)}
                          className="h-7 w-7 text-muted hover:text-primary"
                          aria-label={`Tăng số lượng ${line.name}`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(line.productId)}
                        className="p-1 text-muted hover:text-sale"
                        aria-label={`Xoá ${line.name} khỏi giỏ`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-line px-5 py-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted">Tạm tính</span>
                <span className="font-heading text-xl font-bold text-primary">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/gio-hang" onClick={closeCart} className="btn-outline">
                  Xem giỏ hàng
                </Link>
                <Link href="/thanh-toan" onClick={closeCart} className="btn-primary">
                  Thanh toán
                </Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
