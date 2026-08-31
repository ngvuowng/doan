import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { api } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { formatDateTime, formatPrice } from '@/lib/format'
import { StatusBadge } from '@/components/account/StatusBadge'

export const metadata: Metadata = { title: 'Đơn hàng của tôi' }

export default async function MyOrdersPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/tai-khoan/dang-nhap')

  const orders = await api.orders.mine()

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-line py-16 text-center">
        <p className="mb-4 text-muted">Bạn chưa có đơn hàng nào.</p>
        <Link href="/cua-hang" className="btn-primary">
          Mua sắm ngay
        </Link>
      </div>
    )
  }

  return (
    <>
      <h2 className="mb-4 font-heading text-lg font-bold uppercase">Đơn hàng của tôi</h2>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-shell text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Mã đơn</th>
              <th className="px-4 py-3 font-medium">Ngày đặt</th>
              <th className="px-4 py-3 font-medium">Số sản phẩm</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 text-right font-medium">Tổng tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-shell/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/tai-khoan/don-hang/${o.code}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {o.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{formatDateTime(o.createdAt)}</td>
                <td className="px-4 py-3">{o.itemCount}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatPrice(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
