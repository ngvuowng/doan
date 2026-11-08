import Image from 'next/image'
import Link from 'next/link'
import { SITE } from '@/lib/site'
import { SectionHeading } from '@/components/home/SectionHeading'
import { HeadsetIcon, LeafIcon, ShieldIcon, TruckIcon } from '@/components/site/icons'

/** Bốn cam kết dịch vụ (trước đây là dải FeatureStrip), giữ nguyên nội dung. */
const FEATURES = [
  { Icon: LeafIcon, title: 'Nông sản tươi sạch', text: 'Tuyển chọn mỗi ngày, rõ nguồn gốc' },
  { Icon: TruckIcon, title: 'Giao hàng nhanh', text: 'Nội thành TP. HCM trong 2 giờ' },
  { Icon: ShieldIcon, title: 'Cam kết chất lượng', text: 'Đổi trả trong 24h nếu không tươi' },
  { Icon: HeadsetIcon, title: 'Hỗ trợ tận tình', text: 'Tư vấn 8h - 21h mỗi ngày' },
]

/**
 * Khối giới thiệu kiểu mẫu Bean: chữ bên trái (phụ đề vàng, tiêu đề, đoạn văn, 4 cam kết, nút),
 * ảnh bên phải trong khung viền vàng lùi vào, kèm ảnh nhỏ chồng góc dưới. Mobile xếp chồng,
 * ảnh lên trước.
 */
export function AboutSection() {
  return (
    <section className="bg-shell py-14 md:py-20">
      <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative order-first mx-auto w-full max-w-md pb-10 lg:order-last lg:max-w-none lg:pb-0 lg:pl-10">
          <div className="gold-frame relative aspect-[4/5] overflow-hidden rounded-[20px]">
            <Image
              src="/images/login-bg.jpg"
              alt="Trái cây tươi tại Halona Fruits"
              fill
              sizes="(max-width: 1024px) 90vw, 560px"
              className="object-cover object-[78%_40%]"
            />
          </div>
          <div className="absolute bottom-0 left-0 w-[46%] overflow-hidden rounded-[16px] border-[6px] border-shell shadow-xl lg:-bottom-8 lg:left-0">
            <div className="relative aspect-[7/5]">
              <Image
                src="/images/post-trong-rau-sach.jpg"
                alt=""
                aria-hidden
                fill
                sizes="260px"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div>
          <SectionHeading
            align="left"
            eyebrow="Khơi nguồn cảm hứng"
            title={
              <>
                Trái cây tươi ngon tại <span className="text-gold-ink">{SITE.name}</span>
              </>
            }
          />
          <p className="mt-5 text-[15px] leading-7 text-muted">
            {SITE.description} Mỗi sản phẩm đều có nguồn gốc rõ ràng, được kiểm tra trước khi lên kệ và
            bảo quản lạnh suốt đường giao, để bữa ăn của gia đình bạn luôn tươi ngon và an toàn.
          </p>

          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {FEATURES.map(({ Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-accent text-gold-ink">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-heading text-lg font-medium">{title}</h3>
                  <p className="mt-0.5 text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link href="/gioi-thieu" className="btn-primary mt-9">
            Xem chi tiết
          </Link>
        </div>
      </div>
    </section>
  )
}
