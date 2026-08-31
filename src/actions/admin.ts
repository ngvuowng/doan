'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { api, ApiError } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { ORDER_STATUSES } from '@/lib/orderStatus'

export type AdminState = { errors?: Record<string, string>; formError?: string; success?: boolean }

/**
 * Chặn sớm ở frontend cho thông báo thân thiện. Backend vẫn tự kiểm tra quyền
 * trên từng endpoint `/api/admin/*` nên đây không phải lớp bảo vệ duy nhất.
 */
async function assertAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return null
  return user
}

function collect(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0])
    errors[key] ??= issue.message
  }
  return errors
}

const productSchema = z
  .object({
    name: z.string().trim().min(2, 'Vui lòng nhập tên sản phẩm'),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang'),
    price: z.coerce.number().int().positive('Giá phải lớn hơn 0'),
    salePrice: z.union([z.coerce.number().int().positive(), z.literal('')]).optional(),
    stock: z.coerce.number().int().min(0, 'Tồn kho không được âm'),
    image: z.string().trim().min(1, 'Vui lòng nhập đường dẫn ảnh'),
    shortDescription: z.string().trim().min(5, 'Vui lòng nhập mô tả ngắn'),
    description: z.string().trim().min(5, 'Vui lòng nhập mô tả chi tiết'),
    categoryIds: z.array(z.string()).default([]),
  })
  .refine((d) => !d.salePrice || Number(d.salePrice) < d.price, {
    message: 'Giá khuyến mãi phải nhỏ hơn giá gốc',
    path: ['salePrice'],
  })

function readProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    price: formData.get('price'),
    salePrice: formData.get('salePrice') || '',
    stock: formData.get('stock'),
    image: formData.get('image'),
    shortDescription: formData.get('shortDescription'),
    description: formData.get('description'),
    categoryIds: formData.getAll('categoryIds').map(String),
  })
}

export async function saveProduct(
  productId: string | null,
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await assertAdmin())) return { formError: 'Bạn không có quyền thực hiện thao tác này.' }

  const parsed = readProductForm(formData)
  if (!parsed.success) return { errors: collect(parsed.error) }

  const { salePrice, ...rest } = parsed.data
  const body = {
    ...rest,
    salePrice: salePrice === '' || salePrice === undefined ? null : Number(salePrice),
  }

  try {
    if (productId) {
      await api.admin.updateProduct(productId, body)
    } else {
      await api.admin.createProduct(body)
    }
  } catch (error) {
    // Slug trùng: backend trả 409, gắn lỗi vào đúng ô nhập cho dễ sửa.
    if (error instanceof ApiError && error.status === 409) {
      return { errors: { slug: error.detail } }
    }
    if (error instanceof ApiError) return { formError: error.detail }
    throw error
  }

  revalidatePath('/admin/san-pham')
  revalidatePath('/')
  redirect('/admin/san-pham')
}

export async function deleteProduct(formData: FormData) {
  if (!(await assertAdmin())) return
  const id = String(formData.get('id') ?? '')
  if (!id) return

  await api.admin.deleteProduct(id)
  revalidatePath('/admin/san-pham')
  revalidatePath('/')
}

export async function updateOrderStatus(formData: FormData) {
  if (!(await assertAdmin())) return

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !ORDER_STATUSES.some((s) => s.value === status)) return

  await api.admin.updateOrderStatus(id, status)
  revalidatePath('/admin/don-hang')
}

export async function toggleContactHandled(formData: FormData) {
  if (!(await assertAdmin())) return

  const id = String(formData.get('id') ?? '')
  if (!id) return

  await api.admin.toggleContact(id)
  revalidatePath('/admin/lien-he')
}
