import { SITE } from '@/lib/site'
import { SectionHeading } from '@/components/home/SectionHeading'
import { CountUp } from '@/components/home/CountUp'
import { VideoFacade } from '@/components/home/VideoFacade'

export type Stat = { value: number; suffix?: string; label: string }

/**
 * Dải nền xanh đen duy nhất giữa trang chủ (nhịp tương phản như mẫu Bean): video giới thiệu bên
 * trái, chữ bên phải, hàng 4 con số bên dưới (2×2 trên mobile). Các con số do trang chủ tính từ
 * dữ liệu thật (sản phẩm, danh mục, cửa hàng) nên luôn khớp với cửa hàng.
 */
export function StatsVideo({ stats }: { stats: Stat[] }) {
  return (
    <section className="relative overflow-hidden bg-primary py-14 text-white md:py-20">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_10%,rgb(192_147_66/0.18),transparent_55%)]"
      />

      <div className="container-site relative">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div className="gold-frame relative aspect-video overflow-hidden rounded-[20px] bg-primary-dark">
            <VideoFacade youtubeId={SITE.youtubeId} title={`Giới thiệu ${SITE.name}`} poster="/images/post-trong-rau-sach.jpg" />
          </div>

          <div>
            <SectionHeading
              align="left"
              onDark
              eyebrow="Khoảnh khắc Halona"
              title="Từ vườn trồng đến bàn ăn của bạn"
            />
            <p className="mt-5 text-[15px] leading-7 text-white/75">
              Cùng xem cách chúng tôi chọn từng quả, bảo quản lạnh và đóng gói cẩn thận trước khi giao.
              Mỗi đơn hàng là một lời cam kết về độ tươi và nguồn gốc rõ ràng.
            </p>
          </div>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-y-8 border-t border-white/15 pt-10 lg:mt-16 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`px-3 text-center ${i % 2 === 1 ? 'border-l border-white/15' : ''} ${i > 0 ? 'lg:border-l lg:border-white/15' : ''}`}
            >
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-heading text-4xl font-medium text-accent md:text-5xl">
                <span className="sr-only">
                  {s.value.toLocaleString('vi-VN')}
                  {s.suffix}
                </span>
                <CountUp value={s.value} />
                <span aria-hidden>{s.suffix}</span>
              </dd>
              <dd aria-hidden className="mt-2 text-sm text-white/75">
                {s.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
