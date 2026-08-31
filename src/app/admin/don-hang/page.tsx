import type { Metadata } from 'next'
import Link from 'next/link'
import { api } from '@/lib/api'
import { formatDateTime, formatPrice } from '@/lib/format'
import { ORDER_STATUSES, PAYMENT_LABEL } from '@/lib/orderStatus'
import { updateOrderStatus } from '@/actions/admin'
import { StatusBadge } from '@/components/account/StatusBadge'

export const metadata: Metadata = { title: 'Quản lý đơn hàng' }

export default async function AdminOrdersPage() {
  const orders = await api.admin.orders()

  if (orders.length === 0) {
    return (
      <>
        <h2 className="mb-4 font-heading text-lg font-bold uppercase">Đơn hàng</h2>
        <p className="rounded-lg border border-line py-16 text-center text-muted">
          Chưa có đơn hàng nào.
        </p>
      </>
    )
  }

  return (
    <>
      <h2 className="mb-4 font-heading text-lg font-bold uppercase">Đơn hàng ({orders.length})</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-lg border border-line">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
              <div>
                <p className="font-heading text-base font-bold text-primary">{order.code}</p>
                <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
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
                <span className="text-muted">Thanh toán: </span>
                {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
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
              <span className="font-heading text-lg font-bold text-primary">
                {formatPrice(order.total)}
              </span>
            </footer>
          </article>
        ))}
      </div>
    </>
  )
}
