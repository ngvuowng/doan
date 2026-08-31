import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { api } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { OrderDetail } from '@/components/account/OrderDetail'
import { StatusBadge } from '@/components/account/StatusBadge'

export const metadata: Metadata = { title: 'Chi tiết đơn hàng' }

export default async function MyOrderDetailPage({
  params,
}: PageProps<'/tai-khoan/don-hang/[code]'>) {
  const session = await getCurrentUser()
  if (!session) redirect('/tai-khoan/dang-nhap')

  const { code } = await params
  const order = await api.orders.get(code)

  // Chỉ chủ đơn (hoặc quản trị viên) mới xem được chi tiết.
  if (!order || (order.userId !== session.id && session.role !== 'ADMIN')) notFound()

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold uppercase">Đơn hàng {order.code}</h2>
        <StatusBadge status={order.status} />
      </div>

      <OrderDetail order={order} />

      <Link href="/tai-khoan/don-hang" className="btn-outline mt-5">
        ← Quay lại danh sách đơn
      </Link>
    </>
  )
}
