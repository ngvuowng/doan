'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/site/icons'

/**
 * Slider trang chủ (2 slide như bản gốc), dùng CSS scroll-snap thay vì thư viện ngoài.
 *
 * Slide 1 của bản gốc (`banner-home-1.png`) không có trong kho lưu trữ Wayback nên
 * được dựng lại bằng HTML/CSS theo đúng tông màu và thông điệp của site.
 */
export function HeroSlider() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const total = 2

  function goTo(next: number) {
    const track = trackRef.current
    if (!track) return
    const target = ((next % total) + total) % total
    track.scrollTo({ left: track.clientWidth * target, behavior: 'smooth' })
    setIndex(target)
  }

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
    <section className="relative" aria-label="Banner chính">
      <div
        ref={trackRef}
        className="snap-row flex snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Slide 1 — dựng lại bằng CSS (ảnh gốc không còn trong kho lưu trữ) */}
        <div className="relative w-full shrink-0 snap-start">
          <div className="relative aspect-[16/7] w-full overflow-hidden bg-[linear-gradient(115deg,#4e7a24_0%,#669933_45%,#8fbc5a_100%)] md:aspect-[1920/650]">
            <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
            <div className="absolute -bottom-32 right-10 h-96 w-96 rounded-full bg-black/10" />

            <div className="container-site relative flex h-full items-center">
              <div className="max-w-lg text-white">
                <p className="mb-2 font-accent text-xl md:text-3xl">Halona Fruits</p>
                <h2 className="font-heading text-2xl font-bold uppercase leading-tight text-white sm:text-4xl md:text-5xl">
                  Trái cây tươi sạch
                  <br />
                  mỗi ngày
                </h2>
                <p className="mt-3 hidden text-sm text-white/90 sm:block md:text-base">
                  Nhà cung cấp thực phẩm tươi sạch hàng đầu khu vực phía nam.
                </p>
                <Link
                  href="/cua-hang"
                  className="mt-5 inline-flex rounded-full bg-white px-7 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-ink hover:text-white"
                >
                  Mua sắm ngay
                </Link>
              </div>

              <div className="pointer-events-none absolute bottom-0 right-4 hidden h-[85%] w-[38%] md:block">
                <Image
                  src="/images/product-tao-nhap-khau.png"
                  alt=""
                  aria-hidden
                  fill
                  priority
                  sizes="38vw"
                  className="object-contain object-bottom drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Slide 2 — banner gốc phục hồi từ Wayback */}
        <div className="relative w-full shrink-0 snap-start">
          <Link href="/cua-hang" className="block">
            <div className="relative aspect-[16/7] w-full md:aspect-[1343/503]">
              <Image
                src="/images/hero-2.jpg"
                alt="Halona Fruits - trái cây nhập khẩu"
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        aria-label="Banner trước"
        className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow transition-colors hover:bg-primary hover:text-white"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        aria-label="Banner kế tiếp"
        className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow transition-colors hover:bg-primary hover:text-white"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Chuyển đến banner ${i + 1}`}
            aria-current={i === index}
            className={`h-2.5 w-2.5 rounded-full border border-white transition-colors ${
              i === index ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
