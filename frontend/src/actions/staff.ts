'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { api, ApiError } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { PERMISSIONS, STAFF_ROLES } from '@/lib/permissions'
import { collectIssues, type FormState } from '@/lib/validation'

/** Quản lý nhân sự chỉ dành cho ADMIN; backend kiểm lại ở mọi endpoint `/api/admin/staff`. */
async function assertAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return null
  return user
}

const NO_PERMISSION: FormState = { formError: 'Bạn không có quyền thực hiện thao tác này.' }

const PERMISSION_KEYS: readonly string[] = PERMISSIONS.map((p) => p.key)
const ROLE_VALUES: readonly string[] = STAFF_ROLES.map((r) => r.value)

const staffSchema = z.object({
  name: z.string().trim().min(2, 'Vui lòng nhập họ tên'),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{9,10}$/, 'Số điện thoại không hợp lệ')
    .or(z.literal('')),
  role: z.string().refine((r) => ROLE_VALUES.includes(r), 'Vui lòng chọn vai trò'),
  storeId: z.string().trim(),
  permissions: z.array(z.string().refine((p) => PERMISSION_KEYS.includes(p))),
})

const createSchema = staffSchema.extend({
  email: z.string().trim().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự'),
})

export async function saveStaff(
  staffId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await assertAdmin())) return NO_PERMISSION

  const raw = {
    name: formData.get('name'),
    phone: formData.get('phone') ?? '',
    role: formData.get('role'),
    storeId: formData.get('storeId') ?? '',
    permissions: formData.getAll('permissions').map(String),
    email: formData.get('email'),
    password: formData.get('password'),
  }
  const parsed = staffId ? staffSchema.safeParse(raw) : createSchema.safeParse(raw)
  if (!parsed.success) return { errors: collectIssues(parsed.error) }

  const { name, phone, role, storeId, permissions } = parsed.data
  // ADMIN có toàn quyền và không thuộc cửa hàng nào; form đã khoá các ô này (input
  // `disabled` không được gửi lên) nên ở đây chủ động bỏ qua cho chắc.
  const isAdmin = role === 'ADMIN'
  if (!isAdmin && !storeId) return { errors: { storeId: 'Vui lòng chọn cửa hàng' } }
  const body = {
    name,
    phone: phone || null,
    role,
    storeId: isAdmin ? null : storeId,
    permissions: isAdmin ? [] : permissions,
  }

  try {
    if (staffId) {
      await api.admin.staff.update(staffId, body)
    } else {
      // Không có staffId thì đã parse bằng createSchema nên chắc chắn có email/mật khẩu.
      const { email, password } = parsed.data as z.infer<typeof createSchema>
      await api.admin.staff.create({ ...body, email, password })
    }
  } catch (error) {
    // Email trùng: backend trả 409, gắn lỗi vào đúng ô nhập cho dễ sửa.
    if (error instanceof ApiError && error.status === 409) {
      return { errors: { email: error.detail } }
    }
    if (error instanceof ApiError) return { formError: error.detail }
    throw error
  }

  revalidatePath('/admin/nhan-su')
  redirect('/admin/nhan-su')
}

/** Khoá (nghỉ việc) hoặc mở khoá tài khoản; `isActive` là "true"/"false" từ nút bấm. */
export async function setStaffActive(formData: FormData) {
  if (!(await assertAdmin())) return

  const id = String(formData.get('id') ?? '')
  const isActive = formData.get('isActive') === 'true'
  if (!id) return

  await api.admin.staff.setActive(id, isActive)
  revalidatePath('/admin/nhan-su')
}

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  })

export async function resetStaffPassword(
  staffId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await assertAdmin())) return NO_PERMISSION

  const parsed = passwordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { errors: collectIssues(parsed.error) }

  try {
    await api.admin.staff.resetPassword(staffId, parsed.data.password)
  } catch (error) {
    if (error instanceof ApiError) return { formError: error.detail }
    throw error
  }

  return { success: true }
}
