'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/site/icons'

const TOTAL = 2
const AUTOPLAY_MS = 5000

/**
 * Slider trang chủ (2 slide), dùng CSS scroll-snap thay vì thư viện ngoài.
 * Cả hai slide dựng bằng HTML/CSS theo token màu (ảnh banner cũ có màu in cứng trong ảnh).
 * Tự chuyển slide sau 5 giây; tạm dừng khi rê chuột hoặc focus vào banner.
 */
export function HeroSlider() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const goTo = useCallback((next: number) => {
    const track = trackRef.current
    if (!track) return
    const target = ((next % TOTAL) + TOTAL) % TOTAL
    track.scrollTo({ left: track.clientWidth * target, behavior: 'smooth' })
    setIndex(target)
  }, [])

  // Tự chuyển slide. Phụ thuộc index nên mỗi lần đổi slide (kể cả bấm nút, vuốt tay) đếm lại từ đầu.
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setTimeout(() => goTo(index + 1), AUTOPLAY_MS)
    return () => clearTimeout(timer)
  }, [index, paused, goTo])

  // Đồng bộ chấm chỉ báo khi người dùng tự vuốt slider.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (track.clientWidth > 0) setIndex(Math.round(track.scrollLeft / track.clientWidth))
      })
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      track.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <section
      className="relative"
      aria-label="Banner chính"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false)
      }}
    >
      <div
        ref={trackRef}
        className="snap-row flex snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Slide 1 — nền be, đĩa xanh rừng lớn tràn mép phải, trên đó là "đĩa" kem đựng táo.
            Ảnh táo có nền trắng đặc nên đặt trên nền kem với mix-blend-multiply cho nền tan đi. */}
        <div className="relative w-full shrink-0 snap-start">
          <div className="relative aspect-[16/7] min-h-[280px] w-full overflow-hidden bg-shell md:aspect-[1920/650]">
            <div className="absolute right-[-40%] top-1/2 aspect-square h-[120%] -translate-y-1/2 rounded-full bg-primary md:right-[-6%] md:h-[140%]" />
            <div className="pointer-events-none absolute right-[-8%] top-1/2 aspect-square h-[64%] -translate-y-1/2 rounded-full bg-cream shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] md:right-[8%] md:h-[80%]">
              <Image
                src="/images/product-tao-nhap-khau.png"
                alt=""
                aria-hidden
                fill
                priority
                sizes="(max-width: 768px) 40vw, 30vw"
                className="object-contain p-[14%] mix-blend-multiply"
              />
            </div>
            <div className="absolute bottom-[14%] right-[33%] hidden h-12 w-12 rounded-full bg-accent md:block lg:right-[34%]" />

            <div className="container-site relative flex h-full items-center">
              <div className="max-w-[58%] md:max-w-xl">
                <h2 className="font-heading text-3xl font-semibold leading-[1.1] text-primary sm:text-5xl lg:text-6xl">
                  Trái cây tươi sạch mỗi ngày
                </h2>
                <p className="mt-4 hidden max-w-md text-base text-muted sm:block">
                  Nhà cung cấp thực phẩm tươi sạch hàng đầu khu vực phía nam.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/cua-hang" className="btn-primary">
                    Mua sắm ngay
                  </Link>
                  <Link href="/danh-muc-san-pham/qua-tang-trai-cay" className="btn-outline hidden sm:inline-flex">
                    Xem quà tặng
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 2 — nền xanh rừng, hai ảnh giỏ quà xếp chồng */}
        <div className="relative w-full shrink-0 snap-start">
          <div className="relative aspect-[16/7] min-h-[280px] w-full overflow-hidden bg-primary-dark md:aspect-[1920/650]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_45%,var(--color-primary)_0%,transparent_60%)]" />

            <div className="container-site relative flex h-full items-center">
              <div className="max-w-xl text-white md:max-w-[46%]">
                <h2 className="font-heading text-3xl font-semibold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
                  Quà tặng trái cây cao cấp
                </h2>
                <p className="mt-4 hidden max-w-md text-base text-white/75 sm:block">
                  Giỏ quà gói sẵn cho sinh nhật, khai trương và lễ Tết.
                </p>
                <Link href="/danh-muc-san-pham/qua-tang-trai-cay" className="btn-accent mt-6">
                  Chọn giỏ quà
                </Link>
              </div>

              <div className="pointer-events-none absolute inset-y-0 right-4 hidden w-[48%] md:block">
                <div className="absolute right-[34%] top-[14%] aspect-square h-[62%] rotate-[-6deg] overflow-hidden rounded-2xl bg-white p-1.5 shadow-2xl">
                  <div className="relative h-full w-full overflow-hidden rounded-xl">
                    <Image
                      src="/images/product-hop-qua-trai-cay-chuc-mung-cao-cap-mix-dua-nhat.jpg"
                      alt=""
                      aria-hidden
                      fill
                      sizes="25vw"
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="absolute bottom-[10%] right-[4%] aspect-square h-[68%] rotate-[4deg] overflow-hidden rounded-2xl bg-white p-1.5 shadow-2xl">
                  <div className="relative h-full w-full overflow-hidden rounded-xl">
                    <Image
                      src="/images/product-gio-qua-trai-cay-chuc-mung-vip.jpg"
                      alt=""
                      aria-hidden
                      fill
                      sizes="25vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        aria-label="Banner trước"
        className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow transition-colors hover:bg-white hover:text-primary md:grid"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        aria-label="Banner kế tiếp"
        className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow transition-colors hover:bg-white hover:text-primary md:grid"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>

      {/* Chấm chỉ báo nằm trong viên nền trắng để rõ trên cả slide sáng lẫn tối. */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-white/75 px-2.5 py-1.5 backdrop-blur">
        {Array.from({ length: TOTAL }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Chuyển đến banner ${i + 1}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${i === index ? 'w-5 bg-primary' : 'w-2 bg-primary/25'}`}
          />
        ))}
      </div>
    </section>
  )
}
