import type { Metadata } from 'next'
import { api } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { STAFF_ROLES } from '@/lib/permissions'
import { StaffForm } from '@/components/admin/StaffForm'

export const metadata: Metadata = { title: 'Thêm nhân viên' }

export default async function NewStaffPage() {
  await requireAdmin()
  const stores = await api.stores.list()
  // Mở form với vai trò đầu danh sách và bộ quyền mặc định của vai trò đó.
  const [firstRole] = STAFF_ROLES

  return (
    <>
      <h2 className="mb-4 font-heading text-lg font-bold uppercase">Thêm nhân viên</h2>
      <div className="rounded-lg border border-line p-5">
        <StaffForm
          stores={stores}
          staff={{
            id: null,
            name: '',
            email: '',
            phone: '',
            role: firstRole.value,
            storeId: '',
            permissions: [...firstRole.defaults],
          }}
        />
      </div>
    </>
  )
}
