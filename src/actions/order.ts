'use server'

import { randomBytes } from 'node:crypto'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

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

export type CheckoutState = {
  errors?: Record<string, string>
  formError?: string
}

/** Mã đơn ngắn, dễ đọc cho khách, vd. "HL-8F3K2A". */
function generateOrderCode() {
  return `HL-${randomBytes(3).toString('hex').toUpperCase()}`
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

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0])
      errors[key] ??= issue.message
    }
    return { errors }
  }

  // Giỏ hàng nằm ở localStorage nên client gửi kèm; không tin giá từ client.
  let lines: z.infer<typeof lineSchema>[]
  try {
    lines = z.array(lineSchema).min(1).parse(JSON.parse(String(formData.get('items') ?? '[]')))
  } catch {
    return { formError: 'Giỏ hàng trống hoặc không hợp lệ.' }
  }

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
  })
  if (products.length !== lines.length) {
    return { formError: 'Một số sản phẩm không còn tồn tại. Vui lòng kiểm tra lại giỏ hàng.' }
  }

  // Giá luôn lấy lại từ CSDL để client không sửa được số tiền.
  const items = lines.map((line) => {
    const product = products.find((p) => p.id === line.productId)!
    const price = product.salePrice ?? product.price
    return {
      productId: product.id,
      name: product.name,
      image: product.image,
      price,
      quantity: line.quantity,
    }
  })

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const user = await getCurrentUser()

  const order = await prisma.order.create({
    data: {
      code: generateOrderCode(),
      userId: user?.id ?? null,
      ...parsed.data,
      note: parsed.data.note || null,
      total,
      items: { create: items },
    },
  })

  redirect(`/dat-hang-thanh-cong/${order.code}`)
}
