import { SITE } from '@/lib/site'
import { ContactForm } from '@/components/site/ContactForm'
import { MailIcon, MapPinIcon, PhoneIcon } from '@/components/site/icons'

/**
 * Khối "Liên hệ tư vấn mua hàng" ở trang chủ.
 * Bản gốc nhúng thêm Facebook Page và video YouTube — giữ lại video, bỏ iframe
 * Facebook vì nó cần app id còn hiệu lực của chủ site gốc.
 */
export function ContactSection() {
  return (
    <section className="py-12">
      <div className="container-site">
        <h2 className="section-title mb-8">Liên hệ tư vấn mua hàng</h2>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <ul className="mb-6 space-y-3 text-sm">
              <li className="flex gap-3">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{SITE.address}</span>
              </li>
              <li className="flex gap-3">
                <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href={`tel:${SITE.phone.replace(/\./g, '')}`} className="hover:text-primary">
                  {SITE.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href={`mailto:${SITE.email}`} className="hover:text-primary">
                  {SITE.email}
                </a>
              </li>
            </ul>
            <ContactForm />
          </div>

          <div className="overflow-hidden rounded-md bg-shell">
            <iframe
              src={`https://www.youtube.com/embed/${SITE.youtubeId}`}
              title="Giới thiệu Halona Fruits"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="aspect-video w-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
