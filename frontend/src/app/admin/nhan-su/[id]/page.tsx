import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { api } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { StaffForm } from '@/components/admin/StaffForm'
import { StaffPasswordForm } from '@/components/admin/StaffPasswordForm'

export const metadata: Metadata = { title: 'Sửa nhân viên' }

export default async function EditStaffPage({ params }: PageProps<'/admin/nhan-su/[id]'>) {
  const me = await requireAdmin()
  const { id } = await params
  // Backend từ chối tự sửa chính mình; đưa về danh sách thay vì hiện form vô dụng.
  if (id === me.id) redirect('/admin/nhan-su')

  const [staff, stores] = await Promise.all([api.admin.staff.get(id), api.stores.list()])
  if (!staff) notFound()

  return (
    <>
      <h2 className="mb-4 font-heading text-lg font-bold uppercase">Sửa: {staff.name}</h2>
      <div className="rounded-lg border border-line p-5">
        <StaffForm
          stores={stores}
          staff={{
            id: staff.id,
            name: staff.name,
            email: staff.email,
            phone: staff.phone ?? '',
            role: staff.role,
            storeId: staff.storeId ?? '',
            permissions: staff.permissions,
          }}
        />
      </div>

      <h3 className="mb-4 mt-8 font-heading text-base font-bold uppercase">Đặt lại mật khẩu</h3>
      <div className="rounded-lg border border-line p-5">
        <StaffPasswordForm staffId={staff.id} />
      </div>
    </>
  )
}
