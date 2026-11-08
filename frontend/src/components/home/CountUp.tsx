'use client'

import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 1600

/**
 * Số chạy từ 0 lên `value` khi lần đầu lọt vào màn hình. Render sẵn giá trị cuối ở server để
 * không-JS và trình đọc màn hình luôn thấy số đúng; chỉ khi client chạy mới đặt lại về 0 rồi đếm.
 * Bỏ hiệu ứng nếu người dùng bật giảm chuyển động.
 */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(value)

  useEffect(() => {
    const el = ref.current
    if (!el || value <= 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Lần gọi đầu tiên báo trạng thái ban đầu: khối còn ở dưới màn hình thì đặt về 0 chờ sẵn.
        if (!entry.isIntersecting) {
          setShown(0)
          return
        }
        observer.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION_MS)
          // ease-out cubic: nhanh lúc đầu, chậm dần khi gần đích.
          setShown(Math.round(value * (1 - (1 - t) ** 3)))
          if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value])

  return (
    <span ref={ref} aria-hidden>
      {shown.toLocaleString('vi-VN')}
    </span>
  )
}
