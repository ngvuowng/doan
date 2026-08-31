'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type CartLine = {
  productId: string
  slug: string
  name: string
  /** Giá thực tế tại thời điểm thêm vào giỏ (đã tính khuyến mãi). */
  price: number
  image: string
  quantity: number
}

type CartContextValue = {
  items: CartLine[]
  /** Tổng số lượng sản phẩm, dùng cho badge trên icon giỏ hàng. */
  count: number
  subtotal: number
  isOpen: boolean
  /** true cho tới khi đọc xong localStorage — tránh lệch nội dung server/client. */
  isLoading: boolean
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'halona-cart'

function readStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Lọc bản ghi hỏng để một mục lỗi không làm mất cả giỏ hàng.
    return parsed.filter(
      (l): l is CartLine =>
        !!l &&
        typeof l === 'object' &&
        typeof (l as CartLine).productId === 'string' &&
        typeof (l as CartLine).price === 'number' &&
        typeof (l as CartLine).quantity === 'number' &&
        (l as CartLine).quantity > 0,
    )
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Đọc giỏ hàng sau khi mount. Server không truy cập được localStorage nên lần render
  // đầu buộc phải là giỏ rỗng; đọc trong effect là cách chuẩn để HTML của server và
  // client khớp nhau, tránh lỗi hydration.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- đồng bộ với localStorage sau hydration */
    setItems(readStorage())
    setIsLoading(false)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  useEffect(() => {
    if (isLoading) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Chế độ riêng tư có thể chặn ghi — bỏ qua, giỏ hàng vẫn dùng được trong phiên.
    }
  }, [items, isLoading])

  // Khoá cuộn nền khi drawer giỏ hàng đang mở.
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  const add = useCallback((line: Omit<CartLine, 'quantity'>, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((l) => l.productId === line.productId)
      if (existing) {
        return current.map((l) =>
          l.productId === line.productId ? { ...l, quantity: l.quantity + quantity } : l,
        )
      }
      return [...current, { ...line, quantity }]
    })
    setIsOpen(true)
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((l) => l.productId !== productId)
        : current.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    )
  }, [])

  const remove = useCallback((productId: string) => {
    setItems((current) => current.filter((l) => l.productId !== productId))
  }, [])

  const clear = useCallback(() => setItems([]), [])
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, l) => sum + l.quantity, 0)
    const subtotal = items.reduce((sum, l) => sum + l.price * l.quantity, 0)
    return {
      items,
      count,
      subtotal,
      isOpen,
      isLoading,
      add,
      setQuantity,
      remove,
      clear,
      openCart,
      closeCart,
    }
  }, [items, isOpen, isLoading, add, setQuantity, remove, clear, openCart, closeCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart phải được dùng bên trong <CartProvider>')
  return ctx
}
