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

export type CheckoutState = FormState & {
  /** Id sản phẩm trong giỏ đã không còn trong CSDL — client gỡ khỏi giỏ hàng. */
  missingProductIds?: string[]
}

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
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
    if (error instanceof ApiError) {
      const ids = (error.data as { missing_product_ids?: unknown } | null)?.missing_product_ids
      const missingProductIds = Array.isArray(ids)
        ? ids.filter((id): id is string => typeof id === 'string')
        : undefined
      return { formError: error.detail, missingProductIds }
    }
    throw error
  }

  // Đơn chuyển khoản qua trang QR trước; trang cảm ơn chỉ hiện khi admin đã nhận tiền.
  redirect(
    parsed.data.paymentMethod === 'BANK' ? `/thanh-toan/${code}` : `/dat-hang-thanh-cong/${code}`,
  )
}

export type PaymentState = {
  status: string
  paymentStatus: string
  paymentExpiresAt: string | null
}

/**
 * Trang QR (client) polling hàm này vài giây một lần để biết admin đã nhận tiền chưa.
 * Backend tự huỷ đơn quá hạn ngay trong lần đọc này nên client không cần tự kết luận.
 */
export async function getPaymentState(code: string): Promise<PaymentState | null> {
  const parsed = z.string().trim().regex(/^[A-Z0-9-]{4,30}$/).safeParse(code)
  if (!parsed.success) return null

  const order = await api.orders.get(parsed.data)
  if (!order) return null
  return {
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentExpiresAt: order.paymentExpiresAt,
  }
}
