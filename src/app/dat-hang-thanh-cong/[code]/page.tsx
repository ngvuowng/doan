import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatDateTime, formatPrice } from '@/lib/format'
import { PageHeader } from '@/components/site/PageHeader'
import { ClearCartOnMount } from '@/components/cart/ClearCartOnMount'
import { CheckIcon } from '@/components/site/icons'

export const metadata: Metadata = { title: 'Đặt hàng thành công' }

const PAYMENT_LABEL: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  BANK: 'Chuyển khoản ngân hàng',
}

export default async function OrderSuccessPage({
  params,
}: PageProps<'/dat-hang-thanh-cong/[code]'>) {
  const { code } = await params
  const order = await prisma.order.findUnique({ where: { code }, include: { items: true } })
  if (!order) notFound()

  return (
    <>
      <ClearCartOnMount />
      <PageHeader title="Đặt hàng thành công" crumbs={[{ label: 'Đặt hàng thành công' }]} />

      <div className="container-site py-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex flex-col items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-white">
              <CheckIcon className="h-7 w-7" />
            </span>
            <h2 className="font-heading text-xl font-bold">Cảm ơn bạn đã đặt hàng!</h2>
            <p className="text-sm text-muted">
              Mã đơn hàng của bạn là{' '}
              <strong className="font-heading text-base text-primary">{order.code}</strong>. Chúng
              tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.
            </p>
          </div>

          <section className="rounded-lg border border-line">
            <h3 className="border-b border-line px-5 py-3 font-heading text-base font-bold uppercase">
              Chi tiết đơn hàng
            </h3>

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
                  <span className="text-sm font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>
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

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/cua-hang" className="btn-outline">
              Tiếp tục mua sắm
            </Link>
            <Link href="/tai-khoan/don-hang" className="btn-primary">
              Xem đơn hàng của tôi
            </Link>
          </div>
        </div>
      </div>
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
