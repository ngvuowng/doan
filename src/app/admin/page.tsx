import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDateTime, formatPrice } from '@/lib/format'
import { StatusBadge } from '@/components/account/StatusBadge'

export const metadata: Metadata = { title: 'Quản trị' }

export default async function AdminDashboard() {
  const [productCount, orderCount, postCount, unread, revenue, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.post.count(),
    prisma.contactMessage.count({ where: { handled: false } }),
    prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { total: true } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 font-heading text-lg font-bold uppercase">Tổng quan</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label="Sản phẩm" value={String(productCount)} href="/admin/san-pham" />
          <Stat label="Đơn hàng" value={String(orderCount)} href="/admin/don-hang" />
          <Stat label="Bài viết" value={String(postCount)} href="/admin/bai-viet" />
          <Stat label="Liên hệ chưa xử lý" value={String(unread)} href="/admin/lien-he" />
          <Stat label="Doanh thu" value={formatPrice(revenue._sum.total ?? 0)} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-heading text-lg font-bold uppercase">Đơn hàng gần đây</h2>
        {recentOrders.length === 0 ? (
          <p className="rounded-lg border border-line py-12 text-center text-muted">
            Chưa có đơn hàng nào.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-shell text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Mã đơn</th>
                  <th className="px-4 py-3 font-medium">Khách hàng</th>
                  <th className="px-4 py-3 font-medium">Ngày đặt</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-medium">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-medium text-primary">{o.code}</td>
                    <td className="px-4 py-3">{o.customerName}</td>
                    <td className="px-4 py-3 text-muted">{formatDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-heading text-xl font-bold">{value}</p>
    </>
  )
  return href ? (
    <Link href={href} className="rounded-lg border border-line p-4 transition-colors hover:border-primary">
      {content}
    </Link>
  ) : (
    <div className="rounded-lg border border-line p-4">{content}</div>
  )
}
