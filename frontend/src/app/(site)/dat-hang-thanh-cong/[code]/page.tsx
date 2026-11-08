import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { needsBankPayment } from '@/lib/orderStatus'
import { PageHeader } from '@/components/site/PageHeader'
import { OrderDetail } from '@/components/account/OrderDetail'
import { ClearCartOnMount } from '@/components/cart/ClearCartOnMount'
import { CheckIcon } from '@/components/site/icons'

export const metadata: Metadata = { title: 'Đặt hàng thành công' }

export default async function OrderSuccessPage({
  params,
}: PageProps<'/dat-hang-thanh-cong/[code]'>) {
  const { code } = await params
  const order = await api.orders.get(code)
  if (!order) notFound()
  // Đơn chuyển khoản còn chờ quét QR thì chưa được xem là "thành công".
  if (needsBankPayment(order)) redirect(`/thanh-toan/${order.code}`)

  const isBank = order.paymentMethod === 'BANK'
  const isPaid = order.paymentStatus === 'PAID'

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

          {isBank && isPaid && (
            <p className="mb-6 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-center text-sm">
              Đã nhận thanh toán chuyển khoản
              {order.paidAt && <> lúc {formatDateTime(order.paidAt)}</>}. Đơn hàng đang được chuẩn bị.
            </p>
          )}
          {isBank && !isPaid && (
            // Admin đã tự xác nhận đơn nhưng chưa ghi nhận tiền: cho khách đường quay lại trang QR.
            <p className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm">
              Đơn chưa được ghi nhận thanh toán.{' '}
              <Link href={`/thanh-toan/${order.code}`} className="font-medium text-primary underline">
                Xem thông tin chuyển khoản
              </Link>
            </p>
          )}

          <OrderDetail order={order} heading="Chi tiết đơn hàng" />

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
