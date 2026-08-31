import { statusInfo } from '@/lib/orderStatus'

export function StatusBadge({ status }: { status: string }) {
  const info = statusInfo(status)
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${info.className}`}>
      {info.label}
    </span>
  )
}
