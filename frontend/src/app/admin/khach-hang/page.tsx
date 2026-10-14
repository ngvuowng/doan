import type { Metadata } from 'next'
import Link from 'next/link'
import { api } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { parsePage } from '@/lib/catalog'
import { formatDate, formatPrice } from '@/lib/format'
import { setCustomerActive } from '@/actions/customers'
import { Pagination } from '@/components/shop/Pagination'

export const metadata: Metadata = { title: 'Quản lý khách hàng' }

export default async function AdminCustomersPage({ searchParams }: PageProps<'/admin/khach-hang'>) {
  await requireAdmin()
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''
  const page = parsePage(typeof sp.trang === 'string' ? sp.trang : undefined)
  const { items: customers, total, pageSize } = await api.admin.customers.list({ q, page })

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold">Khách hàng ({total})</h2>
        {/* Form GET: từ khoá nằm trên URL nên phân trang và nút Khoá giữ được bộ lọc. */}
        <form action="/admin/khach-hang" className="flex w-full gap-2 sm:w-auto">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Tên, email hoặc số điện thoại"
            className="field sm:w-72"
          />
          <button type="submit" className="btn-primary">
            Tìm
          </button>
        </form>
      </div>

      {customers.length === 0 ? (
        <p className="rounded-lg border border-line py-16 text-center text-muted">
          Không tìm thấy khách hàng nào.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="bg-shell text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Họ tên</th>
                <th className="px-4 py-3 font-medium">Liên hệ</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Ngày đăng ký</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Số đơn</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Tổng chi tiêu</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {customers.map((c) => (
                <tr key={c.id} className={c.isActive ? '' : 'bg-shell/50 text-muted'}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    {c.email}
                    {c.phone && <span className="block text-xs text-muted">{c.phone}</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3 text-right">{c.orderCount}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatPrice(c.totalSpent)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${
                        c.isActive ? 'bg-primary/15 text-primary-dark' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {c.isActive ? 'Đang hoạt động' : 'Đã khoá'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/khach-hang/${c.id}`}
                        className="rounded-md border border-line px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
                      >
                        Xem
                      </Link>
                      <form action={setCustomerActive}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="isActive" value={c.isActive ? 'false' : 'true'} />
                        <button
                          type="submit"
                          className={`rounded-md border border-line px-3 py-1.5 text-xs ${
                            c.isActive
                              ? 'hover:border-sale hover:text-sale'
                              : 'hover:border-primary hover:text-primary'
                          }`}
                        >
                          {c.isActive ? 'Khoá' : 'Mở khoá'}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={Math.ceil(total / pageSize)}
        basePath="/admin/khach-hang"
        params={{ q }}
      />
    </>
  )
}
