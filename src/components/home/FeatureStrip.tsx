import { HeadsetIcon, LeafIcon, ShieldIcon, TruckIcon } from '@/components/site/icons'

/** Dải cam kết dịch vụ — thay cho khối "VỀ CHÚNG TÔI" dạng chữ ở bản gốc. */
const FEATURES = [
  { Icon: LeafIcon, title: 'Nông sản tươi sạch', text: 'Tuyển chọn mỗi ngày, rõ nguồn gốc' },
  { Icon: TruckIcon, title: 'Giao hàng nhanh', text: 'Nội thành TP. HCM trong 2 giờ' },
  { Icon: ShieldIcon, title: 'Cam kết chất lượng', text: 'Đổi trả trong 24h nếu không tươi' },
  { Icon: HeadsetIcon, title: 'Hỗ trợ tận tình', text: 'Tư vấn 8h - 21h mỗi ngày' },
]

export function FeatureStrip() {
  return (
    <section className="border-y border-line bg-white py-8">
      <div className="container-site grid grid-cols-2 gap-6 lg:grid-cols-4">
        {FEATURES.map(({ Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-heading text-sm font-bold uppercase">{title}</h3>
              <p className="text-xs text-muted">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
