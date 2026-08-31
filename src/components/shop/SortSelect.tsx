'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export const SORT_OPTIONS = [
  { value: 'moi-nhat', label: 'Mới nhất' },
  { value: 'gia-tang', label: 'Giá: thấp đến cao' },
  { value: 'gia-giam', label: 'Giá: cao đến thấp' },
  { value: 'ten', label: 'Tên A-Z' },
] as const

/** Bộ chọn sắp xếp — ghi lựa chọn vào query string để trang server đọc lại được. */
export function SortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const current = params.get('sap-xep') ?? 'moi-nhat'

  function onChange(value: string) {
    const next = new URLSearchParams(params)
    if (value === 'moi-nhat') next.delete('sap-xep')
    else next.set('sap-xep', value)
    next.delete('trang')
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Sắp xếp:</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-line bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
