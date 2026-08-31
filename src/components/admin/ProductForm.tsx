'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { saveProduct, type AdminState } from '@/actions/admin'

const initial: AdminState = {}

export type ProductFormValues = {
  id: string | null
  name: string
  slug: string
  price: number
  salePrice: number | null
  stock: number
  image: string
  shortDescription: string
  description: string
  categoryIds: string[]
}

type Props = {
  product: ProductFormValues
  categories: { id: string; name: string }[]
}

export function ProductForm({ product, categories }: Props) {
  // saveProduct nhận productId qua bind để phân biệt thêm mới và cập nhật.
  const [state, action] = useActionState(saveProduct.bind(null, product.id), initial)

  return (
    <form action={action} className="space-y-4">
      {state.formError && (
        <p className="rounded-md bg-sale/10 px-3 py-2 text-sm text-sale">{state.formError}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên sản phẩm *" error={state.errors?.name}>
          <input name="name" defaultValue={product.name} className="field" required />
        </Field>
        <Field label="Slug (đường dẫn) *" error={state.errors?.slug}>
          <input name="slug" defaultValue={product.slug} className="field" required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Giá gốc (VND) *" error={state.errors?.price}>
          <input name="price" type="number" min={0} defaultValue={product.price} className="field" required />
        </Field>
        <Field label="Giá khuyến mãi (VND)" error={state.errors?.salePrice}>
          <input
            name="salePrice"
            type="number"
            min={0}
            defaultValue={product.salePrice ?? ''}
            className="field"
          />
        </Field>
        <Field label="Tồn kho *" error={state.errors?.stock}>
          <input name="stock" type="number" min={0} defaultValue={product.stock} className="field" required />
        </Field>
      </div>

      <Field label="Đường dẫn ảnh *" error={state.errors?.image}>
        <input
          name="image"
          defaultValue={product.image}
          placeholder="/images/product-bom-my.png"
          className="field"
          required
        />
      </Field>

      <Field label="Mô tả ngắn *" error={state.errors?.shortDescription}>
        <textarea
          name="shortDescription"
          rows={2}
          defaultValue={product.shortDescription}
          className="field"
          required
        />
      </Field>

      <Field label="Mô tả chi tiết (HTML) *" error={state.errors?.description}>
        <textarea
          name="description"
          rows={7}
          defaultValue={product.description}
          className="field font-mono text-xs"
          required
        />
      </Field>

      <fieldset>
        <legend className="label">Danh mục</legend>
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="categoryIds"
                value={c.id}
                defaultChecked={product.categoryIds.includes(c.id)}
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-3 border-t border-line pt-4">
        <SubmitButton isEdit={Boolean(product.id)} />
        <Link href="/admin/san-pham" className="btn-outline">
          Huỷ
        </Link>
      </div>
    </form>
  )
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? 'Đang lưu...' : isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
    </button>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-sale">{error}</p>}
    </div>
  )
}
