'use client'

import { useState } from 'react'
import { useCart } from '@/components/cart/CartProvider'
import type { CartLine } from '@/components/cart/CartProvider'

/** Chọn số lượng + thêm vào giỏ ở trang chi tiết sản phẩm. */
export function AddToCartForm({ line, stock }: { line: Omit<CartLine, 'quantity'>; stock: number }) {
  const { add } = useCart()
  const [quantity, setQuantity] = useState(1)
  const soldOut = stock <= 0

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-full border border-line">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={soldOut}
          className="h-10 w-10 text-lg text-muted transition-colors hover:text-primary disabled:opacity-40"
          aria-label="Giảm số lượng"
        >
          −
        </button>
        <input
          type="number"
          min={1}
          max={stock || 1}
          value={quantity}
          onChange={(e) => {
            const n = Number(e.target.value)
            setQuantity(Number.isFinite(n) ? Math.min(Math.max(1, Math.trunc(n)), stock || 1) : 1)
          }}
          disabled={soldOut}
          aria-label="Số lượng"
          className="h-10 w-14 border-x border-line text-center text-sm focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(stock || 1, q + 1))}
          disabled={soldOut}
          className="h-10 w-10 text-lg text-muted transition-colors hover:text-primary disabled:opacity-40"
          aria-label="Tăng số lượng"
        >
          +
        </button>
      </div>

      <button
        type="button"
        disabled={soldOut}
        onClick={() => add(line, quantity)}
        className="btn-primary px-8"
      >
        {soldOut ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}
      </button>
    </div>
  )
}
