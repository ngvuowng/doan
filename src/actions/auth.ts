'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { api, ApiError } from '@/lib/api'
import { createSession, destroySession, getCurrentUser } from '@/lib/auth'
import { collectIssues, type FormState } from '@/lib/validation'

const loginSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Vui lòng nhập họ tên'),
    email: z.string().trim().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  })

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { errors: collectIssues(parsed.error) }

  let role: string
  try {
    // Backend trả cùng một thông báo cho email sai lẫn mật khẩu sai, nên không
    // lộ được email nào đã đăng ký.
    const { token, user } = await api.auth.login(parsed.data.email, parsed.data.password)
    await createSession(token)
    role = user.role
  } catch (error) {
    if (error instanceof ApiError) return { formError: error.detail }
    throw error
  }

  // redirect() ném lỗi để điều hướng nên phải gọi ngoài khối try/catch ở trên.
  redirect(role === 'ADMIN' ? '/admin' : '/tai-khoan')
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { errors: collectIssues(parsed.error) }

  try {
    const { token } = await api.auth.register(
      parsed.data.name,
      parsed.data.email,
      parsed.data.password,
    )
    await createSession(token)
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return { errors: { email: error.detail } }
    }
    if (error instanceof ApiError) return { formError: error.detail }
    throw error
  }

  redirect('/tai-khoan')
}

export async function logout() {
  await destroySession()
  revalidatePath('/', 'layout')
  redirect('/')
}

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Vui lòng nhập họ tên'),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{9,10}$/, 'Số điện thoại không hợp lệ')
    .or(z.literal('')),
  address: z.string().trim().max(300),
})

export async function updateProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { formError: 'Bạn cần đăng nhập để cập nhật thông tin.' }

  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone') ?? '',
    address: formData.get('address') ?? '',
  })
  if (!parsed.success) return { errors: collectIssues(parsed.error) }

  try {
    await api.auth.updateProfile({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    })
  } catch (error) {
    if (error instanceof ApiError) return { formError: error.detail }
    throw error
  }

  revalidatePath('/tai-khoan')
  return { success: true }
}
