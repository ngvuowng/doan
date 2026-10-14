import Image from 'next/image'
import Link from 'next/link'

/**
 * 2 banner rộng nằm giữa hai khối sản phẩm, đúng vị trí và thông điệp của bản gốc nhưng
 * dựng bằng CSS: ảnh gốc in sẵn màu xanh olive cũ nên không đổi tông theo token được.
 */
const BANNERS = [
  {
    href: '/cua-hang',
    title: 'Ưu đãi trái cây nhập khẩu',
    text: 'Giá tốt cho hàng tuyển chọn kỹ từng quả.',
    image: '/images/product-vai-nhap-khau.png',
    dark: true,
  },
  {
    href: '/cua-hang',
    title: 'Thực phẩm nhập khẩu',
    text: 'Bảo quản lạnh suốt đường đi, nguyên vẹn đến tay bạn.',
    image: '/images/product-bom-my.png',
    dark: false,
  },
]

export function WideBanners() {
  return (
    <section className="container-site py-6">
      <div className="grid gap-4 md:grid-cols-2">
        {BANNERS.map((b) => (
          <Link
            key={b.title}
            href={b.href}
            className={`group relative flex min-h-[220px] items-center overflow-hidden rounded-3xl p-7 sm:p-9 ${
              b.dark ? 'bg-primary text-white' : 'bg-shell text-ink'
            }`}
          >
            {/* Đĩa tròn nằm gọn bên phải làm nền cho ảnh quả (không chạm mép: nền xanh sẽ lộ thành
                viền mảnh ở góc bo). Ảnh PNG gốc có nền trắng đặc nên dùng mix-blend-multiply cho
                nền trắng hoà vào màu đĩa — vì vậy khung ảnh không được có transform (transform tạo
                stacking context, ảnh sẽ không hoà màu với nền phía sau). */}
            <div
              className={`absolute right-[4%] top-1/4 aspect-square h-1/2 rounded-full lg:right-[5%] lg:top-[10%] lg:h-[80%] ${
                b.dark ? 'bg-cream' : 'bg-primary/10'
              }`}
            />
            <div className="pointer-events-none absolute right-[4%] top-1/4 aspect-square h-1/2 lg:right-[5%] lg:top-[10%] lg:h-[80%]">
              <Image
                src={b.image}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 1024px) 40vw, 200px"
                className="object-contain p-[8%] mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="relative max-w-[50%] lg:max-w-[52%]">
              <h3 className={`font-heading text-2xl font-semibold leading-tight sm:text-3xl ${b.dark ? 'text-white' : 'text-primary'}`}>
                {b.title}
              </h3>
              <p className={`mt-2 text-sm ${b.dark ? 'text-white/75' : 'text-muted'}`}>{b.text}</p>
              <span className={`mt-5 ${b.dark ? 'btn-accent' : 'btn-primary'}`}>Mua ngay</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
