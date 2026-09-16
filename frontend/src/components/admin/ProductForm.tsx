'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { saveProduct } from '@/actions/admin'
import { FieldError, FormError, SubmitButton } from '@/components/form/controls'
import type { FormState } from '@/lib/validation'
import { buildCategoryTree } from '@/lib/catalog'

const initial: FormState = {}

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

type CategoryOption = { id: string; name: string; parentId: string | null }

type Props = {
  product: ProductFormValues
  categories: CategoryOption[]
}

export function ProductForm({ product, categories }: Props) {
  // saveProduct nhận productId qua bind để phân biệt thêm mới và cập nhật.
  const [state, action] = useActionState(saveProduct.bind(null, product.id), initial)

  return (
    <form action={action} className="space-y-4">
      {state.formError && <FormError>{state.formError}</FormError>}

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
        {/* Mỗi danh mục gốc một dòng: cha (đậm) rồi các con. Vẫn cho tick cha để form
            hiển thị được mọi trạng thái trong CSDL. */}
        <div className="space-y-2">
          {buildCategoryTree(categories).map((group) => (
            <div key={group.id} className="flex flex-wrap gap-3">
              <CategoryCheckbox category={group} checked={product.categoryIds.includes(group.id)} parent />
              {group.children.map((c) => (
                <CategoryCheckbox key={c.id} category={c} checked={product.categoryIds.includes(c.id)} />
              ))}
            </div>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-3 border-t border-line pt-4">
        <SubmitButton
          label={product.id ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
          pendingLabel="Đang lưu..."
        />
        <Link href="/admin/san-pham" className="btn-outline">
          Huỷ
        </Link>
      </div>
    </form>
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
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}

function CategoryCheckbox({
  category,
  checked,
  parent,
}: {
  category: CategoryOption
  checked: boolean
  parent?: boolean
}) {
  return (
    <label className={`flex items-center gap-2 text-sm ${parent ? 'font-medium' : ''}`}>
      <input type="checkbox" name="categoryIds" value={category.id} defaultChecked={checked} />
      {category.name}
    </label>
  )
}
