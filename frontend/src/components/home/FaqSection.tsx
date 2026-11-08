import Link from 'next/link'
import { SITE } from '@/lib/site'
import { SectionHeading } from '@/components/home/SectionHeading'
import { ChevronDownIcon, PhoneIcon } from '@/components/site/icons'

/**
 * Câu hỏi thường gặp. Nội dung khớp với hệ thống thật: bậc phí giao hàng lấy từ
 * `backend/app/shipping.py`, hình thức thanh toán từ `CheckoutForm`, cam kết giao 2 giờ / đổi trả
 * 24 giờ / tư vấn 8h–21h là các cam kết đã ghi ở trang giới thiệu. Đổi một trong các nguồn đó
 * thì sửa cả ở đây.
 */
const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Phí giao hàng được tính như thế nào?',
    a: 'Phí giao tính theo khoảng cách từ cửa hàng bạn chọn tới địa chỉ nhận: đến 3 km là 15.000₫, đến 10 km là 25.000₫, đến 30 km là 40.000₫, xa hơn là 60.000₫. Nếu bạn không chia sẻ vị trí khi đặt hàng, áp dụng phí chuẩn 30.000₫.',
  },
  {
    q: 'Bao lâu thì tôi nhận được hàng?',
    a: 'Đơn nội thành TP. HCM được giao trong khoảng 2 giờ bằng xe lạnh riêng để trái cây giữ độ tươi suốt đường đi.',
  },
  {
    q: 'Cửa hàng hỗ trợ những hình thức thanh toán nào?',
    a: 'Bạn có thể trả tiền mặt khi nhận hàng (COD) hoặc chuyển khoản ngân hàng. Với chuyển khoản, sau khi đặt hàng bạn nhận mã VietQR có sẵn số tiền và mã đơn; đơn được giữ 15 phút để bạn chuyển khoản.',
  },
  {
    q: 'Trái cây không tươi thì có được đổi trả không?',
    a: 'Có. Trong 24 giờ kể từ khi nhận hàng, nếu sản phẩm không đảm bảo độ tươi, hãy gọi hotline hoặc gửi thông tin qua trang Liên hệ để được đổi trả.',
  },
  {
    q: 'Làm sao để theo dõi đơn hàng của tôi?',
    a: (
      <>
        Đăng nhập rồi vào{' '}
        <Link href="/tai-khoan/don-hang" className="font-medium text-primary underline underline-offset-2 hover:text-gold-ink">
          Tài khoản › Đơn hàng
        </Link>{' '}
        để xem trạng thái và chi tiết từng đơn đã đặt.
      </>
    ),
  },
  {
    q: 'Nên bảo quản trái cây như thế nào?',
    a: 'Phần lớn trái cây nhập khẩu (táo, nho, cherry, kiwi) nên để ngăn mát tủ lạnh và chỉ rửa ngay trước khi ăn. Các loại cần chín thêm như xoài, bơ, chuối nên để ở nhiệt độ phòng cho chín rồi mới cho vào tủ lạnh.',
  },
]

/**
 * Khối FAQ kiểu mẫu Bean: bên trái tiêu đề + lời mời gọi hotline, bên phải accordion. Dùng
 * `<details>/<summary>` gốc nên mở/đóng được bằng bàn phím và cả khi chưa tải JS; cùng thuộc tính
 * `name` để mở câu này thì câu kia tự đóng.
 */
export function FaqSection() {
  return (
    <section className="py-14 md:py-20">
      <div className="container-site grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            align="left"
            eyebrow="Câu hỏi thường gặp"
            title={
              <>
                Giải đáp thắc mắc cùng <span className="text-gold-ink">{SITE.name}</span>
              </>
            }
          />
          <p className="mt-5 text-[15px] leading-7 text-muted">
            Không tìm thấy câu trả lời bạn cần? Gọi hotline hoặc nhắn cho chúng tôi — đội ngũ tư vấn hỗ
            trợ từ 8h đến 21h mỗi ngày.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={`tel:${SITE.phone.replace(/\./g, '')}`} className="btn-primary">
              <PhoneIcon className="h-4 w-4" />
              {SITE.phone}
            </a>
            <Link href="/lien-he" className="btn-outline">
              Gửi câu hỏi
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <details
              key={item.q}
              name="faq"
              open={i === 0}
              className="group rounded-[10px] bg-white ring-1 ring-line transition-shadow open:shadow-[0_18px_40px_-28px_rgb(16_43_42/0.45)] open:ring-accent/60"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-heading text-base font-medium text-primary md:text-lg [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-accent text-gold-ink transition-transform duration-300 group-open:rotate-180 group-open:bg-accent group-open:text-primary-dark">
                  <ChevronDownIcon className="h-4 w-4" />
                </span>
              </summary>
              <div className="px-5 pb-5 text-sm leading-7 text-muted">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
