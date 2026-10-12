import type { ReactNode } from 'react'

export type BreakdownRow = {
  key: string
  label: ReactNode
  /** Độ dài thanh, so với dòng lớn nhất. */
  value: number
  display: string
  note?: string
}

/**
 * Thanh ngang bằng HTML cho các nhóm ít dòng (trạng thái, thanh toán, cửa hàng): một màu,
 * số liệu in sẵn bên cạnh nên không cần tooltip, in ra giấy vẫn sắc nét.
 */
export function BreakdownBars({ rows }: { rows: BreakdownRow[] }) {
  const max = Math.max(0, ...rows.map((r) => r.value))
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0">{row.label}</span>
            <span className="shrink-0 text-right tabular-nums">
              <span className="font-medium">{row.display}</span>
              {row.note && <span className="ml-1.5 text-xs text-muted">{row.note}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-primary/10">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${max ? Math.max((row.value / max) * 100, row.value ? 1 : 0) : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
