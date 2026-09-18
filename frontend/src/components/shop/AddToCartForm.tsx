'use client'

import { useState } from 'react'
import { useCart } from '@/components/cart/CartProvider'
import { QuantityInput } from '@/components/cart/QuantityInput'
import type { CartLine } from '@/components/cart/CartProvider'

/** Chọn số lượng + thêm vào giỏ ở trang chi tiết sản phẩm. */
export function AddToCartForm({ line, stock }: { line: Omit<CartLine, 'quantity'>; stock: number }) {
  const { add } = useCart()
  const [quantity, setQuantity] = useState(1)
  const soldOut = stock <= 0

  return (
    <div className="flex flex-wrap items-center gap-3">
      <QuantityInput
        value={quantity}
        onChange={setQuantity}
        max={stock || 1}
        disabled={soldOut}
        size="md"
      />

      <button
        type="button"
        disabled={soldOut}
        onClick={() => add(line, quantity)}
        className="btn-primary px-8"
      >
        {soldOut ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
      </button>
    </div>
  )
}
