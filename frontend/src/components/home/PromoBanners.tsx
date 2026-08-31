import Image from 'next/image'
import Link from 'next/link'

/** 3 banner khuyến mãi ngang hàng, có hiệu ứng phóng to nhẹ khi rê chuột như bản gốc. */
const BANNERS = [
  { src: '/images/banner1.png', href: '/danh-muc-san-pham/trai-cay-nhap-khau', alt: 'Trái cây nhập khẩu' },
  { src: '/images/banner2.png', href: '/danh-muc-san-pham/trai-cay-noi-dia', alt: 'Trái cây nội địa' },
  { src: '/images/banner3.png', href: '/danh-muc-san-pham/nuoc-ep', alt: 'Các loại nước ép' },
]

export function PromoBanners() {
  return (
    <section className="container-site py-10">
      <div className="grid gap-4 sm:grid-cols-3">
        {BANNERS.map((b) => (
          <Link
            key={b.src}
            href={b.href}
            className="group relative block overflow-hidden rounded-md bg-shell"
          >
            <div className="relative aspect-[360/156]">
              <Image
                src={b.src}
                alt={b.alt}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
