'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/components/cart/CartProvider'
import { formatPrice } from '@/lib/format'
import { CartIcon, TrashIcon } from '@/components/site/icons'

export function CartPageContent() {
  const { items, subtotal, setQuantity, remove, clear, isLoading } = useCart()

  if (isLoading) {
    return <p className="py-16 text-center text-muted">Đang tải giỏ hàng...</p>
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <CartIcon className="h-14 w-14 text-line" />
        <p className="text-muted">Chưa có sản phẩm trong giỏ hàng.</p>
        <Link href="/cua-hang" className="btn-primary">
          Tiếp tục mua sắm
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        {/* Bảng cho màn hình lớn */}
        <table className="hidden w-full md:table">
          <thead>
            <tr className="border-b border-line text-left text-sm text-muted">
              <th className="pb-3 font-normal">Sản phẩm</th>
              <th className="pb-3 font-normal">Giá</th>
              <th className="pb-3 font-normal">Số lượng</th>
              <th className="pb-3 text-right font-normal">Tạm tính</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((line) => (
              <tr key={line.productId}>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/san-pham/${line.slug}`}
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-line"
                    >
                      <Image src={line.image} alt={line.name} fill sizes="64px" className="object-contain p-1" />
                    </Link>
                    <Link href={`/san-pham/${line.slug}`} className="font-medium hover:text-primary">
                      {line.name}
                    </Link>
                  </div>
                </td>
                <td className="py-4 text-primary">{formatPrice(line.price)}</td>
                <td className="py-4">
                  <QuantityControl
                    value={line.quantity}
                    onChange={(q) => setQuantity(line.productId, q)}
                    label={line.name}
                  />
                </td>
                <td className="py-4 text-right font-medium">
                  {formatPrice(line.price * line.quantity)}
                </td>
                <td className="py-4 pl-3 text-right">
                  <button
                    type="button"
                    onClick={() => remove(line.productId)}
                    className="p-1 text-muted hover:text-sale"
                    aria-label={`Xoá ${line.name}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Danh sách dạng thẻ cho mobile */}
        <ul className="divide-y divide-line md:hidden">
          {items.map((line) => (
            <li key={line.productId} className="flex gap-3 py-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-line">
                <Image src={line.image} alt={line.name} fill sizes="80px" className="object-contain p-1" />
              </div>
              <div className="flex-1">
                <Link href={`/san-pham/${line.slug}`} className="font-medium hover:text-primary">
                  {line.name}
                </Link>
                <p className="mt-0.5 text-sm text-primary">{formatPrice(line.price)}</p>
                <div className="mt-2 flex items-center justify-between">
                  <QuantityControl
                    value={line.quantity}
                    onChange={(q) => setQuantity(line.productId, q)}
                    label={line.name}
                  />
                  <button
                    type="button"
                    onClick={() => remove(line.productId)}
                    className="p-1 text-muted hover:text-sale"
                    aria-label={`Xoá ${line.name}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/cua-hang" className="btn-outline">
            Tiếp tục mua sắm
          </Link>
          <button type="button" onClick={clear} className="btn text-sm text-muted hover:text-sale">
            Xoá toàn bộ giỏ hàng
          </button>
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-line p-5">
        <h2 className="mb-4 font-heading text-lg font-bold uppercase">Cộng giỏ hàng</h2>
        <dl className="space-y-2.5 text-sm">
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
        <Link href="/thanh-toan" className="btn-primary mt-5 w-full">
          Tiến hành thanh toán
        </Link>
      </aside>
    </div>
  )
}

function QuantityControl({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (q: number) => void
  label: string
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-line">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="h-8 w-8 text-muted hover:text-primary"
        aria-label={`Giảm số lượng ${label}`}
      >
        −
      </button>
      <span className="w-9 text-center text-sm">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="h-8 w-8 text-muted hover:text-primary"
        aria-label={`Tăng số lượng ${label}`}
      >
        +
      </button>
    </div>
  )
}
