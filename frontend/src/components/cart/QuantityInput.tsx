'use client'

import { useState } from 'react'

/** Trần mặc định cho một dòng giỏ — khớp `quantity.max(999)` trong `actions/order.ts`. */
export const MAX_LINE_QUANTITY = 999

function clampQuantity(n: number, min: number, max: number) {
  return Math.min(Math.max(min, Math.trunc(n)), max)
}

const SIZES = {
  sm: { box: 'rounded-md', button: 'h-8 w-8', input: 'h-8 w-10' },
  md: { box: 'rounded-full', button: 'h-10 w-10 text-lg', input: 'h-10 w-14' },
} as const

/**
 * Ô chọn số lượng: gõ được từ bàn phím và có nút +/−, chỉ nhận số nguyên trong `[min, max]`.
 * Trong lúc gõ, ô giữ bản nháp (được phép rỗng hoặc 0) và chỉ chốt khi rời ô / bấm Enter:
 * rỗng, không phải số hoặc dưới min → trả về giá trị cũ, vượt max → kẹp về trần.
 */
export function QuantityInput({
  value,
  onChange,
  min = 1,
  max = MAX_LINE_QUANTITY,
  disabled = false,
  label = '',
  size = 'sm',
}: {
  value: number
  onChange: (quantity: number) => void
  min?: number
  max?: number
  disabled?: boolean
  /** Tên sản phẩm để nối vào aria-label; để trống ở trang chi tiết. */
  label?: string
  size?: keyof typeof SIZES
}) {
  // null = không focus, hiển thị `value`; chuỗi = đang gõ dở.
  const [draft, setDraft] = useState<string | null>(null)
  const s = SIZES[size]
  const suffix = label ? ` ${label}` : ''

  const commit = () => {
    if (draft !== null) {
      const n = Number.parseInt(draft, 10)
      // Rỗng, không phải số hoặc dưới min (gõ "0") thì không có gì hợp lý để gán → giữ giá trị cũ;
      // vượt max thì kẹp về trần.
      if (Number.isFinite(n) && n >= min) {
        const next = clampQuantity(n, min, max)
        if (next !== value) onChange(next)
      }
    }
    setDraft(null)
  }

  const step = (delta: number) => {
    const next = clampQuantity(value + delta, min, max)
    if (next !== value) onChange(next)
  }

  return (
    <div className={`inline-flex items-center border border-line ${s.box}`}>
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={disabled || value <= min}
        className={`${s.button} text-muted transition-colors hover:text-primary disabled:opacity-40`}
        aria-label={`Giảm số lượng${suffix}`}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        value={draft ?? value}
        onFocus={() => setDraft(String(value))}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, String(max).length))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            setDraft(null)
            step(e.key === 'ArrowUp' ? 1 : -1)
          } else if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault()
          }
        }}
        disabled={disabled}
        aria-label={`Số lượng${suffix}`}
        className={`${s.input} border-x border-line bg-transparent text-center text-sm focus:outline-none disabled:opacity-40`}
      />
      <button
        type="button"
        onClick={() => step(1)}
        disabled={disabled || value >= max}
        className={`${s.button} text-muted transition-colors hover:text-primary disabled:opacity-40`}
        aria-label={`Tăng số lượng${suffix}`}
      >
        +
      </button>
    </div>
  )
}
