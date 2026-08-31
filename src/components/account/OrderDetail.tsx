import Image from 'next/image'
import type { Order } from '@/lib/api'
import { formatDateTime, formatPrice } from '@/lib/format'
import { PAYMENT_LABEL } from '@/lib/orderStatus'

/**
 * Thẻ chi tiết đơn hàng, dùng chung cho trang cảm ơn và trang đơn của tôi.
 * `heading` chỉ có ở trang cảm ơn; mã đơn nằm ngoài thẻ này vì mỗi trang giới
 * thiệu nó một kiểu khác nhau.
 */
export function OrderDetail({ order, heading }: { order: Order; heading?: string }) {
  return (
    <section className="rounded-lg border border-line">
      {heading && (
        <h3 className="border-b border-line px-5 py-3 font-heading text-base font-bold uppercase">
          {heading}
        </h3>
      )}

      <dl className="grid gap-x-6 gap-y-3 px-5 py-4 text-sm sm:grid-cols-2">
        <Row label="Người nhận" value={order.customerName} />
        <Row label="Điện thoại" value={order.phone} />
        <Row label="Email" value={order.email} />
        <Row label="Ngày đặt" value={formatDateTime(order.createdAt)} />
        <Row label="Địa chỉ" value={order.address} full />
        <Row label="Thanh toán" value={PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod} full />
        {order.note && <Row label="Ghi chú" value={order.note} full />}
      </dl>

      <ul className="divide-y divide-line border-t border-line px-5">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-line">
              <Image src={item.image} alt={item.name} fill sizes="56px" className="object-contain p-1" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium">{item.name}</p>
              <p className="text-muted">
                {item.quantity} × {formatPrice(item.price)}
              </p>
            </div>
            <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-line px-5 py-4">
        <span className="font-medium">Tổng cộng</span>
        <span className="font-heading text-xl font-bold text-primary">
          {formatPrice(order.total)}
        </span>
      </div>
    </section>
  )
}

function Row({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
