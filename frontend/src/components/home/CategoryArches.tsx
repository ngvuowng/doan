import Image from 'next/image'
import Link from 'next/link'
import { SectionHeading } from '@/components/home/SectionHeading'

/**
 * Ảnh và câu giới thiệu ngắn cho từng danh mục nổi bật, theo thứ tự hiển thị. Tên lấy từ API
 * (đổi tên trong quản trị là thẻ đổi theo); danh mục bị xoá thì thẻ tự ẩn.
 * `zoom` (viết đủ tên lớp để Tailwind sinh CSS) chỉnh độ phóng của từng ảnh trong khung vòm.
 */
const ARCHES = [
  {
    slug: 'qua-tang-trai-cay',
    text: 'Giỏ quà gói sẵn, trao gửi yêu thương trong mọi dịp.',
    image: '/images/product-gio-qua-trai-cay-chuc-mung-vip.jpg',
    zoom: 'scale-100 group-hover:scale-105',
  },
  {
    slug: 'trai-cay-nhap-khau',
    text: 'Tuyển chọn từ Mỹ, Canada, New Zealand, Nhật Bản.',
    image: '/images/product-cherry-do-canada.jpg',
    zoom: 'scale-100 group-hover:scale-105',
  },
  {
    slug: 'trai-cay-noi-dia',
    text: 'Đặc sản vùng miền, thu hoạch và giao trong ngày.',
    image: '/images/product-xoai-chu-mr9-xuat-khau.jpg',
    zoom: 'scale-100 group-hover:scale-105',
  },
  {
    slug: 'nuoc-ep',
    text: 'Nước ép nguyên chất, đóng chai tiện dùng.',
    image: '/images/product-nuoc-ep-nho-kyoho-nhat-ban-720ml.jpg',
    zoom: 'scale-100 group-hover:scale-105',
  },
  {
    slug: 'trai-cay-tuoi-hang-ngay',
    text: 'Khay và set hoa quả cắt sẵn cho mỗi ngày.',
    image: '/images/product-set-trai-cay-cat-san-05-loai-qua.jpg',
    zoom: 'scale-100 group-hover:scale-105',
  },
  {
    slug: 'cac-loai-rau-cu-qua-oragnic',
    text: 'Rau củ hữu cơ sạch, an toàn cho bữa cơm gia đình.',
    image: '/images/product-ot-chuong-du-mau.jpg',
    zoom: 'scale-100 group-hover:scale-105',
  },
]

type Props = { categories: { slug: string; name: string }[] }

/**
 * Khối "Danh mục nổi bật" kiểu thẻ vòm của mẫu Bean: ảnh trong khung vòm có viền vàng lồng bên
 * trong, tên serif, một dòng mô tả, link "Xem chi tiết". Mobile cuộn ngang (scroll-snap), từ
 * `sm` thành lưới 3 cột và `lg` đủ 6 cột.
 */
export function CategoryArches({ categories }: Props) {
  const items = ARCHES.flatMap((a) => {
    const category = categories.find((c) => c.slug === a.slug)
    return category ? [{ ...a, name: category.name }] : []
  })
  if (items.length === 0) return null

  return (
    <section className="py-14 md:py-20">
      <div className="container-site">
        <SectionHeading eyebrow="Trải nghiệm trái cây" title="Tuyển chọn tươi ngon mỗi ngày" className="mb-8 md:mb-12" />

        {/* Mobile: dải cuộn ngang tự cắt trong khung (không làm trang tràn ngang). */}
        <ul className="snap-row -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {items.map((item) => (
            <li key={item.slug} className="w-[68%] shrink-0 snap-start sm:w-auto">
              <Link href={`/danh-muc-san-pham/${item.slug}`} className="group block text-center">
                <div className="arch relative aspect-[4/5] overflow-hidden bg-shell">
                  <Image
                    src={item.image}
                    alt=""
                    aria-hidden
                    fill
                    sizes="(max-width: 640px) 68vw, (max-width: 1024px) 33vw, 17vw"
                    className={`object-cover transition-transform duration-700 ${item.zoom}`}
                  />
                  <span
                    aria-hidden
                    className="arch pointer-events-none absolute inset-3 border border-accent transition-colors group-hover:border-white"
                  />
                </div>
                <h3 className="mt-5 font-heading text-xl font-medium text-primary transition-colors group-hover:text-gold-ink">
                  {item.name}
                </h3>
                <p className="mx-auto mt-2 max-w-[240px] text-sm leading-6 text-muted">{item.text}</p>
                <span className="mt-3 inline-block text-xs font-semibold tracking-[0.12em] text-gold-ink uppercase">
                  Xem chi tiết
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
