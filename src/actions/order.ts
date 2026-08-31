'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { api, ApiError } from '@/lib/api'
import { collectIssues, type FormState } from '@/lib/validation'

const lineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(999),
})

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, 'Vui lòng nhập họ tên người nhận'),
  email: z.string().trim().email('Email không hợp lệ'),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{9,10}$/, 'Số điện thoại phải gồm 10-11 chữ số và bắt đầu bằng 0'),
  address: z.string().trim().min(8, 'Vui lòng nhập địa chỉ nhận hàng đầy đủ'),
  note: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(['COD', 'BANK']),
})

export async function placeOrder(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = checkoutSchema.safeParse({
    customerName: formData.get('customerName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    note: formData.get('note') ?? '',
    paymentMethod: formData.get('paymentMethod') ?? 'COD',
  })

  if (!parsed.success) return { errors: collectIssues(parsed.error) }

  // Giỏ hàng nằm ở localStorage nên client gửi kèm; backend tự tính lại tiền
  // từ CSDL nên không cần tin số liệu do client gửi lên.
  let lines: z.infer<typeof lineSchema>[]
  try {
    lines = z.array(lineSchema).min(1).parse(JSON.parse(String(formData.get('items') ?? '[]')))
  } catch {
    return { formError: 'Giỏ hàng trống hoặc không hợp lệ.' }
  }

  let code: string
  try {
    const order = await api.orders.create({
      ...parsed.data,
      note: parsed.data.note || undefined,
      items: lines,
    })
    code = order.code
  } catch (error) {
    if (error instanceof ApiError) return { formError: error.detail }
    throw error
  }

  redirect(`/dat-hang-thanh-cong/${code}`)
}
