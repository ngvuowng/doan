'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useActionState } from 'react'
import { useCart } from '@/components/cart/CartProvider'
import { placeOrder } from '@/actions/order'
import { FieldError, FormError, SubmitButton } from '@/components/form/controls'
import type { FormState } from '@/lib/validation'
import { formatPrice } from '@/lib/format'

const initial: FormState = {}

type Props = {
  /** Điền sẵn thông tin nếu khách đã đăng nhập. */
  defaults: { name: string; email: string; phone: string; address: string } | null
}

export function CheckoutForm({ defaults }: Props) {
  const { items, subtotal, isLoading } = useCart()
  const [state, action] = useActionState(placeOrder, initial)
  // Giỏ hàng được dọn ở trang cảm ơn (<ClearCartOnMount />) sau khi đơn đã ghi vào CSDL.

  if (isLoading) return <p className="py-16 text-center text-muted">Đang tải giỏ hàng...</p>

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted">Giỏ hàng đang trống nên chưa thể thanh toán.</p>
        <Link href="/cua-hang" className="btn-primary">
          Chọn sản phẩm
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Giỏ hàng nằm ở localStorage nên gửi kèm; server tự tính lại giá theo CSDL. */}
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(items.map((l) => ({ productId: l.productId, quantity: l.quantity })))}
      />

      <div>
        <h2 className="mb-4 font-heading text-lg font-bold uppercase">Thông tin giao hàng</h2>

        {state.formError && <FormError className="mb-4">{state.formError}</FormError>}

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="customerName">
                Họ và tên người nhận *
              </label>
              <input
                id="customerName"
                name="customerName"
                defaultValue={defaults?.name}
                className="field"
                required
              />
              {state.errors?.customerName && <FieldError>{state.errors.customerName}</FieldError>}
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Số điện thoại *
              </label>
              <input
                id="phone"
                name="phone"
                inputMode="tel"
                defaultValue={defaults?.phone}
                placeholder="0912345678"
                className="field"
                required
              />
              {state.errors?.phone && <FieldError>{state.errors.phone}</FieldError>}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={defaults?.email}
              className="field"
              required
            />
            {state.errors?.email && <FieldError>{state.errors.email}</FieldError>}
          </div>

          <div>
            <label className="label" htmlFor="address">
              Địa chỉ nhận hàng *
            </label>
            <input
              id="address"
              name="address"
              defaultValue={defaults?.address}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
              className="field"
              required
            />
            {state.errors?.address && <FieldError>{state.errors.address}</FieldError>}
          </div>

          <div>
            <label className="label" htmlFor="note">
              Ghi chú đơn hàng
            </label>
            <textarea id="note" name="note" rows={3} className="field" />
          </div>
        </div>

        <h2 className="mb-3 mt-8 font-heading text-lg font-bold uppercase">
          Phương thức thanh toán
        </h2>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 has-checked:border-primary has-checked:bg-primary/5">
            <input type="radio" name="paymentMethod" value="COD" defaultChecked className="mt-1" />
            <span>
              <span className="block text-sm font-medium">Thanh toán khi nhận hàng (COD)</span>
              <span className="block text-xs text-muted">
                Trả tiền mặt cho nhân viên giao hàng khi nhận sản phẩm.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 has-checked:border-primary has-checked:bg-primary/5">
            <input type="radio" name="paymentMethod" value="BANK" className="mt-1" />
            <span>
              <span className="block text-sm font-medium">Chuyển khoản ngân hàng</span>
              <span className="block text-xs text-muted">
                Nhân viên sẽ liên hệ gửi thông tin tài khoản sau khi đặt hàng.
              </span>
            </span>
          </label>
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-line p-5">
        <h2 className="mb-4 font-heading text-lg font-bold uppercase">Đơn hàng của bạn</h2>

        <ul className="divide-y divide-line">
          {items.map((line) => (
            <li key={line.productId} className="flex gap-3 py-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-line">
                <Image src={line.image} alt={line.name} fill sizes="56px" className="object-contain p-1" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium">{line.name}</p>
                <p className="text-muted">
                  {line.quantity} × {formatPrice(line.price)}
                </p>
              </div>
              <span className="text-sm font-medium">{formatPrice(line.price * line.quantity)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Tạm tính</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Phí giao hàng</dt>
            <dd className="text-primary">Miễn phí</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
            <dt>Tổng cộng</dt>
            <dd className="font-heading text-xl font-bold text-primary">{formatPrice(subtotal)}</dd>
          </div>
        </dl>

        <SubmitButton
        className="btn-primary mt-5 w-full"
        label="Đặt hàng"
        pendingLabel="Đang xử lý..."
      />
      </aside>
    </form>
  )
}
