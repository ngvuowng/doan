'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SITE } from '@/lib/site'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/site/icons'

const TOTAL = 2
const AUTOPLAY_MS = 5000

// Hai slide cùng chiều cao cố định theo breakpoint để chữ không bị cắt trên màn hình hẹp.
const SLIDE = 'relative h-[480px] w-full shrink-0 snap-start overflow-hidden sm:h-[540px] lg:h-[640px]'
const ARROW =
  'absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 ' +
  'text-white backdrop-blur-sm transition-colors hover:border-accent hover:bg-accent hover:text-primary-dark md:grid'

/**
 * Slider trang chủ (2 slide) kiểu mẫu Bean: ảnh tràn màn hình phủ lớp tối, chữ serif lớn ở giữa.
 * Dùng CSS scroll-snap thay vì thư viện ngoài. Tự chuyển slide sau 5 giây; tạm dừng khi rê chuột
 * hoặc focus vào banner.
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
        {/* Slide 1 — ảnh trái cây tràn khung, phủ gradient xanh đen, chữ căn giữa. */}
        <div className={SLIDE}>
          <Image
            src="/images/login-bg.jpg"
            alt=""
            aria-hidden
            fill
            preload
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(4_30_29/0.55)_0%,rgb(4_30_29/0.72)_100%)]" />

          <div className="container-site relative flex h-full flex-col items-center justify-center text-center text-white">
            <p className="eyebrow text-primary-light">
              <span aria-hidden className="h-px w-8 bg-accent" />
              {SITE.name}
              <span aria-hidden className="h-px w-8 bg-accent" />
            </p>
            <h1 className="mt-4 max-w-3xl font-heading text-[34px] leading-[1.12] font-medium text-balance text-white sm:text-5xl lg:text-[64px]">
              Trái Cây Tươi Sạch Mỗi Ngày
            </h1>
            <p className="mt-4 max-w-xl text-sm text-white/80 sm:text-base">
              Tuyển chọn trái cây nhập khẩu và đặc sản vùng miền, giao tận nơi trong ngày.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/cua-hang" className="btn-accent">
                Mua sắm ngay
              </Link>
              <Link
                href="/danh-muc-san-pham/qua-tang-trai-cay"
                className="btn border border-white/60 text-white hover:border-accent hover:bg-accent hover:text-primary-dark"
              >
                Xem quà tặng
              </Link>
            </div>
          </div>
        </div>

        {/* Slide 2 — nền xanh đen, hai ảnh giỏ quà trong khung viền vàng. Trên mobile chỉ giữ
            một ảnh mờ làm nền cho đỡ trống. */}
        <div className={`${SLIDE} bg-primary`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_40%,rgb(192_147_66/0.22)_0%,transparent_60%)]" />
          <Image
            src="/images/product-gio-qua-trai-cay-chuc-mung-vip.jpg"
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="object-cover opacity-20 md:hidden"
          />

          <div className="container-site relative flex h-full items-center">
            <div className="max-w-xl text-white md:max-w-[46%]">
              <p className="eyebrow text-primary-light">
                <span aria-hidden className="h-px w-8 bg-accent" />
                Quà tặng cao cấp
              </p>
              <h2 className="mt-4 font-heading text-[34px] leading-[1.12] font-medium text-balance text-white sm:text-5xl lg:text-[56px]">
                Giỏ Quà Trái Cây Sang Trọng
              </h2>
              <p className="mt-4 max-w-md text-sm text-white/75 sm:text-base">
                Gói sẵn cho sinh nhật, khai trương và lễ Tết — chọn mẫu, chúng tôi giao tận tay.
              </p>
              <Link href="/danh-muc-san-pham/qua-tang-trai-cay" className="btn-accent mt-8">
                Chọn giỏ quà
              </Link>
            </div>

            <div className="pointer-events-none absolute inset-y-0 right-4 hidden w-[48%] md:block">
              <div className="gold-frame absolute right-[36%] top-[12%] aspect-[4/5] h-[62%] overflow-hidden rounded-[20px] shadow-2xl">
                <Image
                  src="/images/product-hop-qua-trai-cay-chuc-mung-cao-cap-mix-dua-nhat.jpg"
                  alt=""
                  aria-hidden
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              </div>
              <div className="gold-frame absolute bottom-[10%] right-[2%] aspect-[4/5] h-[68%] overflow-hidden rounded-[20px] shadow-2xl">
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

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        aria-label="Banner trước"
        className={`${ARROW} left-4`}
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        aria-label="Banner kế tiếp"
        className={`${ARROW} right-4`}
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>

      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
        {Array.from({ length: TOTAL }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Chuyển đến banner ${i + 1}`}
            aria-current={i === index}
            className={`h-2.5 rounded-full transition-all ${i === index ? 'w-7 bg-accent' : 'w-2.5 bg-white/50 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </section>
  )
}
