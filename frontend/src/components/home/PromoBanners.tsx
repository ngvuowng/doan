import Image from 'next/image'
import Link from 'next/link'

/**
 * 3 thẻ danh mục dựng bằng CSS (ảnh banner cũ có lớp màu in cứng và ghi sai danh mục).
 * Ảnh kleverfruits có chữ/cờ ở mép trên và dưới, nên cắt tròn và phóng to để chỉ còn phần quả.
 */
const BANNERS = [
  {
    href: '/danh-muc-san-pham/trai-cay-nhap-khau',
    title: 'Trái cây nhập khẩu',
    text: 'Tuyển chọn từ Mỹ, Canada, New Zealand',
    image: '/images/product-cherry-do-canada.jpg',
    tone: 'bg-shell',
  },
  {
    href: '/danh-muc-san-pham/trai-cay-noi-dia',
    title: 'Trái cây nội địa',
    text: 'Đặc sản vùng miền, tươi mỗi ngày',
    image: '/images/product-buoi-hong-da-xanh-xuat-khau.jpg',
    tone: 'bg-primary/10',
  },
  {
    href: '/danh-muc-san-pham/nuoc-ep',
    title: 'Nước ép trái cây',
    text: 'Nguyên chất, đóng chai tiện dùng',
    image: '/images/product-nuoc-ep-nho-kyoho-nhat-ban-720ml.jpg',
    tone: 'bg-accent/10',
  },
]

export function PromoBanners() {
  return (
    <section className="container-site py-10">
      <div className="grid gap-4 sm:grid-cols-3">
        {BANNERS.map((b) => (
          <Link
            key={b.href}
            href={b.href}
            className={`group flex items-center justify-between gap-3 overflow-hidden rounded-2xl p-5 ${b.tone}`}
          >
            <div className="min-w-0">
              <h3 className="font-heading text-xl font-semibold text-primary">{b.title}</h3>
              <p className="mt-1 text-sm text-muted">{b.text}</p>
              <span className="mt-3 inline-block text-sm font-medium text-ink underline decoration-accent decoration-2 underline-offset-4 group-hover:text-accent">
                Xem ngay
              </span>
            </div>
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-white ring-4 ring-white lg:h-28 lg:w-28">
              <Image
                src={b.image}
                alt=""
                aria-hidden
                fill
                sizes="112px"
                className="scale-[1.4] object-cover transition-transform duration-500 group-hover:scale-[1.5]"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
