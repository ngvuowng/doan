import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/site/PageHeader'
import { OrderDetail } from '@/components/account/OrderDetail'
import { ClearCartOnMount } from '@/components/cart/ClearCartOnMount'
import { PaymentWatcher } from '@/components/cart/PaymentWatcher'

export const metadata: Metadata = { title: 'Thanh toán đơn hàng' }

/**
 * Trang quét QR cho đơn chuyển khoản. Đơn COD hoặc đã trả thì về thẳng trang cảm ơn;
 * đơn không còn PENDING (hết hạn / admin huỷ) thì báo ngay, không cần polling.
 */
export default async function OrderPaymentPage({ params }: PageProps<'/thanh-toan/[code]'>) {
  const { code } = await params
  const order = await api.orders.get(code)
  if (!order) notFound()

  if (order.paymentMethod !== 'BANK' || order.paymentStatus === 'PAID') {
    redirect(`/dat-hang-thanh-cong/${order.code}`)
  }

  const waiting = order.status === 'PENDING' && order.paymentExpiresAt

  return (
    <>
      {/* Đơn đã ghi vào CSDL nên dọn giỏ ngay ở đây, không chờ tới trang cảm ơn. */}
      <ClearCartOnMount />
      <PageHeader
        title="Thanh toán đơn hàng"
        crumbs={[{ label: 'Thanh toán' }, { label: order.code }]}
      />

      <div className="container-site py-10">
        <div className="mx-auto max-w-2xl space-y-6">
          <p className="text-center text-sm text-muted">
            Mã đơn hàng của bạn là{' '}
            <strong className="font-heading text-base text-primary">{order.code}</strong>
          </p>

          {waiting ? (
            <PaymentWatcher
              code={order.code}
              total={order.total}
              expiresAt={order.paymentExpiresAt as string}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <h2 className="font-heading text-xl font-bold text-red-700">
                {order.status === 'CANCELLED'
                  ? 'Đơn hàng đã hết hạn thanh toán'
                  : 'Đơn hàng không còn chờ thanh toán'}
              </h2>
              <p className="text-sm text-muted">
                {order.status === 'CANCELLED'
                  ? 'Chúng tôi chưa nhận được thanh toán trong thời gian giữ đơn nên đơn đã bị huỷ. Bạn có thể đặt lại đơn mới.'
                  : 'Trạng thái đơn đã được cập nhật. Vui lòng liên hệ với chúng tôi nếu cần hỗ trợ.'}
              </p>
              <Link href="/cua-hang" className="btn-primary mt-2">
                Quay lại cửa hàng
              </Link>
            </div>
          )}

          <OrderDetail order={order} heading="Chi tiết đơn hàng" />
        </div>
      </div>
    </>
  )
}
