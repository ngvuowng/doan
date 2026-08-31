'use server'

import { z } from 'zod'
import { api, ApiError } from '@/lib/api'
import { collectIssues, type FormState } from '@/lib/validation'

const schema = z.object({
  name: z.string().trim().min(2, 'Vui lòng nhập họ tên'),
  email: z.string().trim().email('Email không hợp lệ'),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{9,10}$/, 'Số điện thoại không hợp lệ')
    .or(z.literal('')),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(10, 'Nội dung cần ít nhất 10 ký tự'),
})

export async function submitContact(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    subject: formData.get('subject') ?? '',
    message: formData.get('message'),
  })

  if (!parsed.success) return { errors: collectIssues(parsed.error) }

  const { name, email, phone, subject, message } = parsed.data
  try {
    await api.contact.create({
      name,
      email,
      phone: phone || null,
      subject: subject || null,
      message,
    })
  } catch (error) {
    if (error instanceof ApiError) return { formError: error.detail }
    throw error
  }

  return { success: true }
}
