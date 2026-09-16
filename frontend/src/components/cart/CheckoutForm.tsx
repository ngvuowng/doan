'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useActionState, useCallback, useState } from 'react'
import { useCart } from '@/components/cart/CartProvider'
import { getShippingQuote, placeOrder, type CheckoutState } from '@/actions/order'
import { FieldError, FormError, SubmitButton } from '@/components/form/controls'
import type { StoreQuote } from '@/lib/api'
import { formatDistance, formatPrice } from '@/lib/format'

const initial: CheckoutState = {}

type Props = {
  /** Điền sẵn thông tin nếu khách đã đăng nhập. */
  defaults: { name: string; email: string; phone: string; address: string } | null
  /** Danh sách cửa hàng (chưa có khoảng cách) do trang server lấy từ API. */
  stores: StoreQuote[]
}

type LocateState = { status: 'idle' | 'loading' | 'done' | 'error'; message?: string }

export function CheckoutForm({ defaults, stores: initialStores }: Props) {
  const { items, subtotal, isLoading, remove, setQuantity } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK'>('COD')
  // Cửa hàng giao hàng: mặc định cửa hàng đầu danh sách; sau khi khách chia sẻ vị trí
  // thì danh sách được thay bằng bản có khoảng cách/phí và tự chọn cửa hàng gần nhất.
  // Giữ ở state (controlled) để React không reset lựa chọn khi submit bị lỗi validate.
  const [stores, setStores] = useState(initialStores)
  const [storeId, setStoreId] = useState(initialStores[0]?.id ?? '')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locate, setLocate] = useState<LocateState>({ status: 'idle' })
  const shippingFee = stores.find((s) => s.id === storeId)?.shippingFee ?? 0

  const locateMe = useCallback(() => {
    const fallback = 'Hãy tự chọn cửa hàng; phí giao hàng áp dụng mức chuẩn.'
    if (!navigator.geolocation) {
      setLocate({ status: 'error', message: `Trình duyệt không hỗ trợ định vị. ${fallback}` })
      return
    }
    setLocate({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const point = { lat: position.coords.latitude, lng: position.coords.longitude }
        const quoted = await getShippingQuote(point.lat, point.lng)
        if (!quoted || quoted.length === 0) {
          setLocate({ status: 'error', message: `Không tính được phí theo vị trí. ${fallback}` })
          return
        }
        setStores(quoted)
        setStoreId(quoted[0].id)
        setCoords(point)
        setLocate({ status: 'done', message: `Đã chọn cửa hàng gần bạn nhất: ${quoted[0].name}.` })
      },
      (error) => {
        const reason =
          error.code === error.PERMISSION_DENIED
            ? 'Bạn chưa cho phép chia sẻ vị trí.'
            : 'Không lấy được vị trí của bạn.'
        setLocate({ status: 'error', message: `${reason} ${fallback}` })
      },
      { timeout: 10000, maximumAge: 300000 },
    )
  }, [])
  // Giỏ hàng nằm ở localStorage nên có thể chứa sản phẩm đã bị xoá trong CSDL hoặc
  // vượt tồn kho hiện tại. Khi backend báo, sửa giỏ cho khớp và nêu tên để khách biết vì sao.
  const submit = useCallback(
    async (prev: CheckoutState, formData: FormData): Promise<CheckoutState> => {
      const result = await placeOrder(prev, formData)
      const missing = result.missingProductIds ?? []
      if (missing.length > 0) {
        const names = items.filter((l) => missing.includes(l.productId)).map((l) => l.name)
        missing.forEach(remove)
        return {
          ...result,
          formError: `Sản phẩm không còn bán và đã được gỡ khỏi giỏ: ${names.join(', ')}. Vui lòng kiểm tra lại giỏ hàng trước khi đặt.`,
        }
      }
      const short = result.outOfStock ?? []
      if (short.length > 0) {
        // Hạ số lượng về mức còn lại; 0 thì setQuantity tự gỡ dòng.
        short.forEach((l) => setQuantity(l.productId, l.stock))
        const names = short.map((l) =>
          l.stock > 0 ? `${l.name} (chỉ còn ${l.stock})` : `${l.name} (hết hàng)`,
        )
        return {
          ...result,
          formError: `Một số sản phẩm không đủ hàng nên giỏ đã được điều chỉnh: ${names.join(', ')}. Vui lòng kiểm tra lại giỏ hàng trước khi đặt.`,
        }
      }
      return result
    },
    [items, remove, setQuantity],
  )
  const [state, action] = useActionState(submit, initial)
  // Giỏ hàng được dọn ở trang cảm ơn (<ClearCartOnMount />) sau khi đơn đã ghi vào CSDL.

  if (isLoading) return <p className="py-16 text-center text-muted">Đang tải giỏ hàng...</p>

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        {state.formError && <FormError>{state.formError}</FormError>}
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

        <h2 className="mb-1 mt-8 font-heading text-lg font-bold uppercase">Cửa hàng giao hàng</h2>
        <p className="mb-3 text-sm text-muted">
          Chọn cửa hàng gần bạn nhất để tối ưu phí giao hàng. Phí tính theo khoảng cách từ cửa
          hàng tới vị trí của bạn.
        </p>
        <button
          type="button"
          onClick={locateMe}
          disabled={locate.status === 'loading'}
          className="btn-outline mb-3"
        >
          {locate.status === 'loading' ? 'Đang xác định vị trí...' : 'Dùng vị trí của tôi'}
        </button>
        {locate.message && (
          <p className={`mb-3 text-xs ${locate.status === 'error' ? 'text-sale' : 'text-primary'}`}>
            {locate.message}
          </p>
        )}
        {/* Chỉ gửi toạ độ khi khách đã chia sẻ; backend tự tính khoảng cách và phí. */}
        {coords && (
          <>
            <input type="hidden" name="lat" value={String(coords.lat)} />
            <input type="hidden" name="lng" value={String(coords.lng)} />
          </>
        )}
        <div className="space-y-2">
          {stores.map((store) => (
            <label
              key={store.id}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 has-checked:border-primary has-checked:bg-primary/5"
            >
              <input
                type="radio"
                name="storeId"
                value={store.id}
                checked={storeId === store.id}
                onChange={() => setStoreId(store.id)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium">{store.name}</span>
                <span className="block text-xs text-muted">{store.address}</span>
                <span className="block text-xs text-muted">
                  {store.distanceKm != null
                    ? `Cách ${formatDistance(store.distanceKm)} · `
                    : ''}
                  Phí giao hàng {formatPrice(store.shippingFee)}
                  {store.distanceKm == null && ' (mức chuẩn khi chưa xác định vị trí)'}
                </span>
              </span>
            </label>
          ))}
        </div>
        {state.errors?.storeId && <FieldError>{state.errors.storeId}</FieldError>}

        <h2 className="mb-3 mt-8 font-heading text-lg font-bold uppercase">
          Phương thức thanh toán
        </h2>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 has-checked:border-primary has-checked:bg-primary/5">
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={paymentMethod === 'COD'}
              onChange={() => setPaymentMethod('COD')}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium">Thanh toán khi nhận hàng (COD)</span>
              <span className="block text-xs text-muted">
                Trả tiền mặt cho nhân viên giao hàng khi nhận sản phẩm.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 has-checked:border-primary has-checked:bg-primary/5">
            <input
              type="radio"
              name="paymentMethod"
              value="BANK"
              checked={paymentMethod === 'BANK'}
              onChange={() => setPaymentMethod('BANK')}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium">Chuyển khoản ngân hàng</span>
              <span className="block text-xs text-muted">
                Sau khi đặt hàng bạn sẽ nhận mã QR có sẵn số tiền và mã đơn. Đơn được giữ 15
                phút để bạn chuyển khoản.
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
            <dd>{formatPrice(shippingFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
            <dt>Tổng cộng</dt>
            <dd className="font-heading text-xl font-bold text-primary">
              {formatPrice(subtotal + shippingFee)}
            </dd>
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
