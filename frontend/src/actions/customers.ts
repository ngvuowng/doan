'use server'

import { revalidatePath } from 'next/cache'
import { api } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'

/** Quản lý khách hàng chỉ dành cho ADMIN; backend kiểm lại ở mọi endpoint `/api/admin/customers`. */
async function assertAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return null
  return user
}

/** Khoá hoặc mở khoá tài khoản khách; `isActive` là "true"/"false" từ nút bấm. */
export async function setCustomerActive(formData: FormData) {
  if (!(await assertAdmin())) return

  const id = String(formData.get('id') ?? '')
  const isActive = formData.get('isActive') === 'true'
  if (!id) return

  await api.admin.customers.setActive(id, isActive)
  // Nút có ở cả danh sách lẫn trang chi tiết; không redirect nên giữ nguyên ?q=&trang=.
  revalidatePath('/admin/khach-hang', 'layout')
}
