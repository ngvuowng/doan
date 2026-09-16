import type { Metadata } from 'next'
import Link from 'next/link'
import { api } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { roleLabel } from '@/lib/permissions'
import { setStaffActive } from '@/actions/staff'

export const metadata: Metadata = { title: 'Quản lý nhân sự' }

export default async function AdminStaffPage() {
  const me = await requireAdmin()
  const staff = await api.admin.staff.list()

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold uppercase">Nhân sự ({staff.length})</h2>
        <Link href="/admin/nhan-su/moi" className="btn-primary">
          + Thêm nhân viên
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-shell text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Họ tên</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Vai trò</th>
              <th className="px-4 py-3 font-medium">Cửa hàng</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {staff.map((s) => (
              <tr key={s.id} className={s.isActive ? '' : 'bg-shell/50 text-muted'}>
                <td className="px-4 py-3 font-medium">
                  {s.name}
                  {s.id === me.id && <span className="ml-1 text-xs text-muted">(bạn)</span>}
                </td>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">{roleLabel(s.role)}</td>
                <td className="px-4 py-3">
                  {s.role === 'ADMIN' ? '—' : (s.store?.name ?? 'Chưa gắn cửa hàng')}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      s.isActive ? 'bg-primary/15 text-primary-dark' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {s.isActive ? 'Đang làm việc' : 'Đã khoá'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {/* Không cho tự sửa/khoá chính mình để không tự khoá khỏi hệ thống. */}
                  {s.id !== me.id && (
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/nhan-su/${s.id}`}
                        className="rounded-md border border-line px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
                      >
                        Sửa
                      </Link>
                      <form action={setStaffActive}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="isActive" value={s.isActive ? 'false' : 'true'} />
                        <button
                          type="submit"
                          className={`rounded-md border border-line px-3 py-1.5 text-xs ${
                            s.isActive
                              ? 'hover:border-sale hover:text-sale'
                              : 'hover:border-primary hover:text-primary'
                          }`}
                        >
                          {s.isActive ? 'Khoá' : 'Mở khoá'}
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
