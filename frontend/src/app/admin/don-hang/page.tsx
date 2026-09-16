import type { Metadata } from 'next'
import Link from 'next/link'
import { api } from '@/lib/api'
import { requirePermission } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { formatDateTime, formatDistance, formatPrice } from '@/lib/format'
import { ORDER_STATUSES, PAYMENT_LABEL } from '@/lib/orderStatus'
import { markOrderPaid, updateOrderStatus } from '@/actions/admin'
import { PaymentBadge, StatusBadge } from '@/components/account/StatusBadge'
import { FormError } from '@/components/form/controls'

export const metadata: Metadata = { title: 'Quản lý đơn hàng' }

export default async function AdminOrdersPage({ searchParams }: PageProps<'/admin/don-hang'>) {
  const user = await requirePermission('orders.view')
  const canUpdate = can(user, 'orders.update')
  const canConfirmPayment = can(user, 'orders.payment')
  // Server Action đổi trạng thái không có state nên báo lỗi qua `?loi=` (xem actions/admin.ts).
  const { loi } = await searchParams
  const error = typeof loi === 'string' ? loi : null
  const orders = await api.admin.orders()

  if (orders.length === 0) {
    return (
      <>
        <h2 className="mb-4 font-heading text-lg font-bold uppercase">Đơn hàng</h2>
        {error && <FormError className="mb-4">{error}</FormError>}
        <p className="rounded-lg border border-line py-16 text-center text-muted">
          Chưa có đơn hàng nào.
        </p>
      </>
    )
  }

  return (
    <>
      <h2 className="mb-4 font-heading text-lg font-bold uppercase">Đơn hàng ({orders.length})</h2>
      {error && <FormError className="mb-4">{error}</FormError>}

      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-lg border border-line">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
              <div>
                <p className="font-heading text-base font-bold text-primary">{order.code}</p>
                <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={order.status} />
                {order.paymentMethod === 'BANK' && <PaymentBadge status={order.paymentStatus} />}
                {canConfirmPayment && order.paymentMethod === 'BANK' && order.paymentStatus === 'UNPAID' && (
                  <form action={markOrderPaid}>
                    <input type="hidden" name="id" value={order.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
                    >
                      Đã nhận tiền
                    </button>
                  </form>
                )}
                {canUpdate && (
                  <form action={updateOrderStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={order.id} />
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="rounded-md border border-line px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                      aria-label={`Trạng thái đơn ${order.code}`}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-md border border-line px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
                    >
                      Lưu
                    </button>
                  </form>
                )}
              </div>
            </header>

            <div className="grid gap-x-6 gap-y-2 px-5 py-3 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted">Khách hàng: </span>
                {order.customerName} — {order.phone}
              </p>
              <p>
                <span className="text-muted">Email: </span>
                {order.email}
              </p>
              <p className="sm:col-span-2">
                <span className="text-muted">Địa chỉ: </span>
                {order.address}
              </p>
              <p className="sm:col-span-2">
                <span className="text-muted">Cửa hàng giao: </span>
                {order.store ? `${order.store.name} — ${order.store.address}` : '—'}
                {order.distanceKm != null && (
                  <span className="text-muted"> (cách {formatDistance(order.distanceKm)})</span>
                )}
              </p>
              <p className="sm:col-span-2">
                <span className="text-muted">Thanh toán: </span>
                {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
                {order.paymentMethod === 'BANK' && order.paidAt && (
                  <span className="text-muted"> — nhận tiền lúc {formatDateTime(order.paidAt)}</span>
                )}
              </p>
              {order.note && (
                <p className="sm:col-span-2">
                  <span className="text-muted">Ghi chú: </span>
                  {order.note}
                </p>
              )}
            </div>

            <ul className="divide-y divide-line border-t border-line px-5 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between py-2.5">
                  <span>
                    {item.name} <span className="text-muted">× {item.quantity}</span>
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <footer className="flex items-center justify-between border-t border-line px-5 py-3">
              <Link
                href={`/tai-khoan/don-hang/${order.code}`}
                className="text-sm text-primary hover:underline"
              >
                Xem chi tiết
              </Link>
              <span>
                <span className="mr-3 text-xs text-muted">
                  Phí giao hàng {formatPrice(order.shippingFee)}
                </span>
                <span className="font-heading text-lg font-bold text-primary">
                  {formatPrice(order.total)}
                </span>
              </span>
            </footer>
          </article>
        ))}
      </div>
    </>
  )
}
