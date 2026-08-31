import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatDateTime, formatPrice } from '@/lib/format'
import { PAYMENT_LABEL } from '@/lib/orderStatus'
import { StatusBadge } from '@/components/account/StatusBadge'

export const metadata: Metadata = { title: 'Chi tiết đơn hàng' }

export default async function MyOrderDetailPage({
  params,
}: PageProps<'/tai-khoan/don-hang/[code]'>) {
  const session = await getCurrentUser()
  if (!session) redirect('/tai-khoan/dang-nhap')

  const { code } = await params
  const order = await prisma.order.findUnique({ where: { code }, include: { items: true } })

  // Chỉ chủ đơn (hoặc quản trị viên) mới xem được chi tiết.
  if (!order || (order.userId !== session.id && session.role !== 'ADMIN')) notFound()

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold uppercase">Đơn hàng {order.code}</h2>
        <StatusBadge status={order.status} />
      </div>

      <section className="rounded-lg border border-line">
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

      <Link href="/tai-khoan/don-hang" className="btn-outline mt-5">
        ← Quay lại danh sách đơn
      </Link>
    </>
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
