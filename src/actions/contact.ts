'use server'

import { z } from 'zod'
import { api, ApiError } from '@/lib/api'

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

export type ContactState = {
  ok: boolean
  message?: string
  errors?: Record<string, string>
}

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    subject: formData.get('subject') ?? '',
    message: formData.get('message'),
  })

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0])
      errors[key] ??= issue.message
    }
    return { ok: false, errors }
  }

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
    if (error instanceof ApiError) return { ok: false, message: error.detail }
    throw error
  }

  return { ok: true, message: 'Cảm ơn bạn! Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.' }
}
