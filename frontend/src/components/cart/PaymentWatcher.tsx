'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getPaymentState } from '@/actions/order'
import { BankTransferInfo } from '@/components/cart/BankTransferInfo'
import { vietQrUrl } from '@/lib/vietqr'

const POLL_MS = 4000

type Props = {
  code: string
  total: number
  /** ISO UTC, do backend đặt lúc tạo đơn. */
  expiresAt: string
}

type Phase = 'waiting' | 'expired' | 'cancelled'

/**
 * Khối QR + đếm ngược trên trang thanh toán. Polling server action `getPaymentState`
 * bằng chuỗi setTimeout (server action chạy tuần tự nên không dùng setInterval — các
 * lượt gọi sẽ xếp hàng nếu một lượt chậm). Backend là nguồn sự thật cho cả "đã trả"
 * lẫn "hết hạn"; đồng hồ ở client chỉ để hiển thị.
 */
export function PaymentWatcher({ code, total, expiresAt }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('waiting')
  const [deadline, setDeadline] = useState(() => new Date(expiresAt).getTime())
  // null cho tới khi mount để HTML server và client khớp nhau (tránh hydration mismatch).
  const [remaining, setRemaining] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const poll = useCallback(async () => {
    const state = await getPaymentState(code)
    if (!state) return 'stop' as const
    if (state.paymentStatus === 'PAID') {
      // replace: khách không "quay lại" được trang QR sau khi đã trả.
      router.replace(`/dat-hang-thanh-cong/${code}`)
      return 'stop' as const
    }
    if (state.status !== 'PENDING') {
      setPhase(state.status === 'CANCELLED' ? 'expired' : 'cancelled')
      return 'stop' as const
    }
    if (state.paymentExpiresAt) setDeadline(new Date(state.paymentExpiresAt).getTime())
    return 'continue' as const
  }, [code, router])

  useEffect(() => {
    let cancelled = false

    const schedule = (delay: number) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(tick, delay)
    }

    const tick = async () => {
      if (cancelled) return
      // Tab ẩn thì không gọi; quay lại tab sẽ gọi ngay nhờ listener bên dưới.
      if (document.visibilityState === 'hidden') return
      const result = await poll()
      if (cancelled || result === 'stop') return
      schedule(POLL_MS)
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') schedule(0)
    }

    document.addEventListener('visibilitychange', onVisible)
    schedule(0)
    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [poll])

  // Đếm ngược mỗi giây; chạm 0 thì poll ngay để backend chốt trạng thái hết hạn.
  useEffect(() => {
    if (phase !== 'waiting') return
    let id: ReturnType<typeof setInterval> | null = null
    const update = () => {
      const left = Math.max(0, deadline - Date.now())
      setRemaining(left)
      if (left === 0) {
        if (id) clearInterval(id)
        void poll()
      }
    }
    id = setInterval(update, 1000)
    update()
    return () => {
      if (id) clearInterval(id)
    }
  }, [deadline, phase, poll])

  if (phase !== 'waiting') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="font-heading text-xl font-bold text-red-700">
          {phase === 'expired' ? 'Đơn hàng đã hết hạn thanh toán' : 'Đơn hàng đã được cập nhật'}
        </h2>
        <p className="text-sm text-muted">
          {phase === 'expired'
            ? 'Chúng tôi chưa nhận được thanh toán trong thời gian giữ đơn nên đơn đã bị huỷ. Bạn có thể đặt lại đơn mới.'
            : 'Trạng thái đơn đã thay đổi. Vui lòng xem lại chi tiết đơn hàng hoặc liên hệ với chúng tôi.'}
        </p>
        <Link href="/cua-hang" className="btn-primary mt-2">
          Quay lại cửa hàng
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4">
        <div>
          <p className="font-heading text-base font-bold">Quét mã QR để thanh toán</p>
          <p className="text-sm text-muted">
            Sau khi nhận được tiền, hệ thống sẽ tự chuyển bạn sang trang xác nhận.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Đơn được giữ trong</p>
          <p className="font-heading text-2xl font-bold tabular-nums text-primary">
            {remaining === null ? '--:--' : formatCountdown(remaining)}
          </p>
        </div>
      </div>

      <BankTransferInfo amount={total} transferNote={code} qrSrc={vietQrUrl(total, code)} />

      <p className="flex items-center justify-center gap-2 text-sm text-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden />
        Đang chờ xác nhận thanh toán...
      </p>
    </div>
  )
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
