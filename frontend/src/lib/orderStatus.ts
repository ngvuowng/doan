/** Nhãn và màu hiển thị cho trạng thái đơn hàng. */
export const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Chờ xác nhận', className: 'bg-amber-100 text-amber-800' },
  { value: 'CONFIRMED', label: 'Đã xác nhận', className: 'bg-sky-100 text-sky-800' },
  { value: 'SHIPPING', label: 'Đang giao', className: 'bg-indigo-100 text-indigo-800' },
  { value: 'COMPLETED', label: 'Hoàn thành', className: 'bg-primary/15 text-primary-dark' },
  { value: 'CANCELLED', label: 'Đã huỷ', className: 'bg-red-100 text-red-700' },
] as const

export function statusInfo(status: string) {
  return (
    ORDER_STATUSES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      className: 'bg-neutral-100 text-neutral-700',
    }
  )
}

export const PAYMENT_LABEL: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  BANK: 'Chuyển khoản ngân hàng',
}
