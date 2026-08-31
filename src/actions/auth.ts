'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSession, destroySession, getCurrentUser } from '@/lib/auth'

export type AuthState = { errors?: Record<string, string>; formError?: string }

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

function collect(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0])
    errors[key] ??= issue.message
  }
  return errors
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { errors: collect(parsed.error) }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  // Thông báo chung cho cả hai trường hợp để không lộ email nào đã đăng ký.
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { formError: 'Email hoặc mật khẩu không đúng.' }
  }

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role })
  redirect(user.role === 'ADMIN' ? '/admin' : '/tai-khoan')
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { errors: collect(parsed.error) }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return { errors: { email: 'Email này đã được đăng ký' } }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    },
  })

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role })
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

export type ProfileState = AuthState & { success?: boolean }

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getCurrentUser()
  if (!user) return { formError: 'Bạn cần đăng nhập để cập nhật thông tin.' }

  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone') ?? '',
    address: formData.get('address') ?? '',
  })
  if (!parsed.success) return { errors: collect(parsed.error) }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    },
  })

  revalidatePath('/tai-khoan')
  return { success: true }
}
