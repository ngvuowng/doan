import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { formatDate, formatDateTime, formatPrice } from '@/lib/format'
import { setCustomerActive } from '@/actions/customers'
import { PaymentBadge, StatusBadge } from '@/components/account/StatusBadge'

export const metadata: Metadata = { title: 'Chi tiết khách hàng' }

export default async function AdminCustomerDetailPage({
  params,
}: PageProps<'/admin/khach-hang/[id]'>) {
  await requireAdmin()
  const { id } = await params
  const customer = await api.admin.customers.get(id)
  if (!customer) notFound()

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/khach-hang" className="text-sm text-primary hover:underline">
          ← Danh sách khách hàng
        </Link>
      </div>

      <section className="rounded-lg border border-line">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-lg font-bold uppercase">{customer.name}</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                customer.isActive ? 'bg-primary/15 text-primary-dark' : 'bg-red-100 text-red-700'
              }`}
            >
              {customer.isActive ? 'Đang hoạt động' : 'Đã khoá'}
            </span>
          </div>
          <form action={setCustomerActive}>
            <input type="hidden" name="id" value={customer.id} />
            <input type="hidden" name="isActive" value={customer.isActive ? 'false' : 'true'} />
            <button
              type="submit"
              className={`rounded-md border border-line px-3 py-1.5 text-xs ${
                customer.isActive
                  ? 'hover:border-sale hover:text-sale'
                  : 'hover:border-primary hover:text-primary'
              }`}
            >
              {customer.isActive ? 'Khoá tài khoản' : 'Mở khoá'}
            </button>
          </form>
        </header>
        <dl className="grid gap-x-8 gap-y-3 px-5 py-4 text-sm sm:grid-cols-2">
          <Field label="Email" value={customer.email} />
          <Field label="Số điện thoại" value={customer.phone ?? '—'} />
          <Field label="Địa chỉ" value={customer.address ?? '—'} />
          <Field label="Ngày đăng ký" value={formatDate(customer.createdAt)} />
        </dl>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Số đơn" value={String(customer.orderCount)} />
        <Stat label="Tổng chi tiêu" value={formatPrice(customer.totalSpent)} />
        <Stat
          label="Đơn gần nhất"
          value={customer.lastOrderAt ? formatDateTime(customer.lastOrderAt) : '—'}
        />
      </section>

      <section>
        <h3 className="mb-4 font-heading text-lg font-bold uppercase">Lịch sử đơn hàng</h3>
        {customer.orders.length === 0 ? (
          <p className="rounded-lg border border-line py-12 text-center text-muted">
            Khách hàng chưa có đơn hàng nào.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-shell text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Mã đơn</th>
                  <th className="px-4 py-3 font-medium">Ngày đặt</th>
                  <th className="px-4 py-3 font-medium">Cửa hàng</th>
                  <th className="px-4 py-3 text-right font-medium">Số SP</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-medium">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {customer.orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/tai-khoan/don-hang/${o.code}`} className="text-primary hover:underline">
                        {o.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">{o.store?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right">{o.itemCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge status={o.status} />
                        {o.paymentMethod === 'BANK' && <PaymentBadge status={o.paymentStatus} />}
                      </div>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-heading text-xl font-bold">{value}</p>
    </div>
  )
}
