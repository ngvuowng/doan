import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SITE } from '@/lib/site'
import { PageHeader } from '@/components/site/PageHeader'
import { CheckIcon, HeadsetIcon, LeafIcon, ShieldIcon, TruckIcon } from '@/components/site/icons'

export const metadata: Metadata = {
  title: 'Giới thiệu',
  description: SITE.description,
}

/**
 * Trang giới thiệu. Bản gốc không có trong kho lưu trữ Wayback, nên nội dung được
 * dựng theo đúng 5 mục mà footer bản gốc liệt kê trong khối "VỀ CHÚNG TÔI".
 */
export default function AboutPage() {
  return (
    <>
      <PageHeader title="Giới thiệu" crumbs={[{ label: 'Giới thiệu' }]} />

      <div className="container-site py-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="font-accent text-2xl text-primary">{SITE.name}</p>
            <h2 className="mt-2 font-heading text-3xl font-bold uppercase">
              Thực phẩm sạch cho mọi gia đình Việt
            </h2>
            <p className="mt-4 text-muted">{SITE.description}</p>
            <p className="mt-3 text-muted">
              Ra đời với mong muốn mang nông sản an toàn đến gần hơn với người tiêu dùng, chúng tôi
              xây dựng chuỗi cung ứng khép kín từ vùng trồng đến tay khách hàng — mỗi sản phẩm đều
              có nguồn gốc rõ ràng và được kiểm định trước khi lên kệ.
            </p>
            <Link href="/cua-hang" className="btn-primary mt-6">
              Khám phá sản phẩm
            </Link>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
            <Image
              src="/images/hero-2.jpg"
              alt="Trái cây tươi sạch tại Halona Fruits"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        <section id="linh-vuc" className="mt-14 scroll-mt-32">
          <h2 className="section-title mb-8">Lĩnh vực hoạt động</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: LeafIcon, title: 'Trái cây nhập khẩu', text: 'Nguồn hàng chính ngạch từ Mỹ, Úc, Nhật, Hàn Quốc.' },
              { Icon: LeafIcon, title: 'Trái cây nội địa', text: 'Liên kết vùng trồng Đà Lạt, Tiền Giang, Bến Tre.' },
              { Icon: ShieldIcon, title: 'Rau củ hữu cơ', text: 'Canh tác không hoá chất, thu hoạch theo ngày.' },
              { Icon: HeadsetIcon, title: 'Nước ép & hạt dinh dưỡng', text: 'Chế biến trong ngày, không chất bảo quản.' },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-line p-5">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-heading text-base font-bold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="chat-luong" className="mt-14 scroll-mt-32">
          <h2 className="section-title mb-8">Chính sách chất lượng</h2>
          <ul className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
            {[
              'Sản phẩm có nguồn gốc, chứng từ nhập khẩu rõ ràng',
              'Kiểm tra cảm quan và dư lượng trước khi bán ra',
              'Bảo quản đúng nhiệt độ trong suốt quá trình vận chuyển',
              'Đổi trả trong 24 giờ nếu sản phẩm không đảm bảo độ tươi',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 rounded-md bg-shell p-3.5 text-sm">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section id="triet-li" className="mt-14 scroll-mt-32">
          <h2 className="section-title mb-8">Triết lí kinh doanh</h2>
          <blockquote className="mx-auto max-w-2xl rounded-lg bg-primary/5 p-6 text-center">
            <p className="font-heading text-xl font-bold text-primary-dark">
              “Bán thứ mình dám cho gia đình mình ăn.”
            </p>
            <p className="mt-3 text-sm text-muted">
              Chúng tôi tin rằng uy tín được xây bằng chất lượng thật của từng ký nông sản, chứ
              không phải bằng lời quảng cáo.
            </p>
          </blockquote>
        </section>

        <section id="nang-luc" className="mt-14 scroll-mt-32">
          <h2 className="section-title mb-8">Năng lực - cơ sở vật chất</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { Icon: TruckIcon, title: 'Đội xe lạnh riêng', text: 'Giao nội thành TP. HCM trong 2 giờ, giữ nhiệt suốt hành trình.' },
              { Icon: ShieldIcon, title: 'Kho lạnh đạt chuẩn', text: 'Hệ thống kho mát phân tầng nhiệt độ theo từng nhóm sản phẩm.' },
              { Icon: HeadsetIcon, title: 'Đội ngũ tư vấn', text: 'Hỗ trợ đặt hàng và tư vấn dinh dưỡng từ 8h đến 21h mỗi ngày.' },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-line p-5">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-heading text-base font-bold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
