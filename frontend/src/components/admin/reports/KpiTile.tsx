import type { Change } from '@/lib/reports'

const ARROW = { up: '▲', down: '▼', flat: '■' } as const

/** Ô chỉ số kèm mức thay đổi so với kỳ trước. Luôn có mũi tên để không chỉ dựa vào màu. */
export function KpiTile({
  label,
  value,
  change,
  higherIsBetter,
  hint,
}: {
  label: string
  value: string
  change: Change | null
  higherIsBetter: boolean
  hint?: string
}) {
  const tone =
    !change || change.direction === 'flat'
      ? 'text-muted'
      : (change.direction === 'up') === higherIsBetter
        ? 'text-primary-dark'
        : 'text-sale'

  return (
    <div className="rounded-lg border border-line p-4 break-inside-avoid">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold">{value}</p>
      <p className="mt-2 text-xs">
        {change ? (
          <span className={`font-medium ${tone}`}>
            {ARROW[change.direction]} {change.direction === 'flat' ? 'Không đổi' : change.text}
          </span>
        ) : (
          <span className="text-muted">—</span>
        )}{' '}
        <span className="text-muted">so với kỳ trước</span>
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}
