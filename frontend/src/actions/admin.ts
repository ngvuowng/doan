'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { api, ApiError } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { ORDER_STATUSES } from '@/lib/orderStatus'
import { can, type Permission } from '@/lib/permissions'
import { collectIssues, type FormState } from '@/lib/validation'

/**
 * Chặn sớm ở frontend cho thông báo thân thiện. Backend vẫn tự kiểm tra quyền
 * trên từng endpoint `/api/admin/*` nên đây không phải lớp bảo vệ duy nhất.
 */
async function assertPermission(permission: Permission) {
  const user = await getCurrentUser()
  if (!user || !can(user, permission)) return null
  return user
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
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await assertPermission('products.edit'))) {
    return { formError: 'Bạn không có quyền thực hiện thao tác này.' }
  }

  const parsed = readProductForm(formData)
  if (!parsed.success) return { errors: collectIssues(parsed.error) }

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
  if (!(await assertPermission('products.edit'))) return
  const id = String(formData.get('id') ?? '')
  if (!id) return

  try {
    await api.admin.deleteProduct(id)
  } catch (error) {
    // 404 nghĩa là sản phẩm đã bị xoá trước đó (vd. bấm nút hai lần) — coi như thành công.
    if (!(error instanceof ApiError && error.status === 404)) throw error
  }

  revalidatePath('/admin/san-pham')
  revalidatePath('/')
}

/**
 * Form ở /admin/don-hang là <form action> không có state (useActionState), nên lỗi API
 * (vd. không đủ tồn kho) được đưa lên URL `?loi=` để trang hiện banner; thành công thì
 * về URL sạch để banner cũ biến mất. redirect() ném lỗi điều hướng nên gọi ngoài try/catch.
 */
function backToOrders(message: string | null): never {
  redirect(message ? `/admin/don-hang?loi=${encodeURIComponent(message)}` : '/admin/don-hang')
}

export async function updateOrderStatus(formData: FormData) {
  if (!(await assertPermission('orders.update'))) return

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !ORDER_STATUSES.some((s) => s.value === status)) return

  let message: string | null = null
  try {
    await api.admin.updateOrderStatus(id, status)
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
    message = error.detail // 400 không đủ tồn kho, 404 đơn đã mất...
  }

  revalidatePath('/admin/don-hang')
  revalidatePath('/admin/san-pham') // Hoàn thành / huỷ đơn làm đổi cột tồn kho.
  backToOrders(message)
}

export async function markOrderPaid(formData: FormData) {
  if (!(await assertPermission('orders.payment'))) return

  const id = String(formData.get('id') ?? '')
  if (!id) return

  let message: string | null = null
  try {
    await api.admin.markOrderPaid(id)
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
    // 409 nghĩa là đã đánh dấu rồi (vd. bấm nút hai lần) — coi như thành công.
    // 400 (không đủ tồn kho, đơn COD) thì phải cho admin thấy.
    if (error.status !== 409) message = error.detail
  }

  revalidatePath('/admin/don-hang')
  revalidatePath('/admin/san-pham')
  revalidatePath('/admin')
  backToOrders(message)
}

export async function toggleContactHandled(formData: FormData) {
  if (!(await assertPermission('contacts.manage'))) return

  const id = String(formData.get('id') ?? '')
  if (!id) return

  await api.admin.toggleContact(id)
  revalidatePath('/admin/lien-he')
}
