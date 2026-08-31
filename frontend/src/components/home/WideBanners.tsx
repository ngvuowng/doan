import Image from 'next/image'
import Link from 'next/link'

/** 2 banner rộng nằm giữa hai khối sản phẩm, theo đúng vị trí của bản gốc. */
const BANNERS = [
  { src: '/images/banner-main-002.png', href: '/cua-hang', alt: 'Ưu đãi trái cây nhập khẩu' },
  { src: '/images/banner-main-003.png', href: '/cua-hang', alt: 'Thực phẩm sạch mỗi ngày' },
]

export function WideBanners() {
  return (
    <section className="container-site py-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {BANNERS.map((b) => (
          <Link key={b.src} href={b.href} className="group block overflow-hidden rounded-md bg-shell">
            <div className="relative aspect-[600/369]">
              <Image
                src={b.src}
                alt={b.alt}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
