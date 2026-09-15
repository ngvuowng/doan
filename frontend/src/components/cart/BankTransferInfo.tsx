import Image from 'next/image'
import { formatPrice } from '@/lib/format'

/**
 * Tài khoản nhận chuyển khoản. Mã QR tĩnh (không số tiền) nằm ở public/images/qr-mb.png;
 * QR động theo đơn sinh bằng `vietQrUrl()` ở lib/vietqr.ts.
 */
export const BANK_ACCOUNT = {
  bank: 'MB Bank (Ngân hàng Quân đội)',
  number: '0000255808420',
  holder: 'THAI TRIEU NGUYEN VUONG',
}

type Props = {
  /** Tổng tiền cần chuyển, nếu đã biết. */
  amount?: number
  /** Nội dung chuyển khoản gợi ý (thường là mã đơn hàng). */
  transferNote?: string
  /** URL ảnh QR động; bỏ trống thì dùng ảnh QR tĩnh. */
  qrSrc?: string
  className?: string
}

export function BankTransferInfo({ amount, transferNote, qrSrc, className = '' }: Props) {
  return (
    <div className={`flex flex-col gap-4 rounded-md border border-line bg-white p-4 sm:flex-row ${className}`}>
      {/* `unoptimized`: QR không được resample, và ảnh ngoài không cần khai remotePatterns. */}
      <Image
        src={qrSrc ?? '/images/qr-mb.png'}
        alt={`Mã QR chuyển khoản ${BANK_ACCOUNT.bank} - ${BANK_ACCOUNT.number}`}
        width={qrSrc ? 240 : 200}
        height={qrSrc ? 284 : 200}
        unoptimized={Boolean(qrSrc)}
        className="mx-auto w-full max-w-60 shrink-0 rounded-md border border-line sm:mx-0"
      />
      <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 self-center text-sm">
        <dt className="text-muted">Ngân hàng</dt>
        <dd className="font-medium">{BANK_ACCOUNT.bank}</dd>
        <dt className="text-muted">Số tài khoản</dt>
        <dd className="font-heading text-base font-bold tracking-wide text-primary">
          {BANK_ACCOUNT.number}
        </dd>
        <dt className="text-muted">Chủ tài khoản</dt>
        <dd className="font-medium">{BANK_ACCOUNT.holder}</dd>
        {amount !== undefined && (
          <>
            <dt className="text-muted">Số tiền</dt>
            <dd className="font-medium">{formatPrice(amount)}</dd>
          </>
        )}
        <dt className="text-muted">Nội dung</dt>
        <dd className="font-medium">{transferNote ?? 'Mã đơn hàng (hiện sau khi đặt hàng)'}</dd>
      </dl>
    </div>
  )
}
