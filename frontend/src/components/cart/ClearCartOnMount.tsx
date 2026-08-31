'use client'

import { useEffect } from 'react'
import { useCart } from '@/components/cart/CartProvider'

/** Dọn giỏ hàng sau khi đơn đã được ghi vào CSDL (đặt ở trang cảm ơn). */
export function ClearCartOnMount() {
  const { clear } = useCart()
  useEffect(() => {
    clear()
  }, [clear])
  return null
}
