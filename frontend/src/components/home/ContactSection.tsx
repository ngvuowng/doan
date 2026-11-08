import Image from 'next/image'
import { SITE } from '@/lib/site'
import { ContactForm } from '@/components/site/ContactForm'
import { SectionHeading } from '@/components/home/SectionHeading'
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from '@/components/site/icons'

/**
 * Khối "Liên hệ tư vấn mua hàng" theo bố cục khối đặt bàn của mẫu Bean: ảnh viền vàng kèm thẻ
 * thông tin liên hệ bên trái, thẻ form bên phải. Video giới thiệu đã chuyển lên dải số liệu.
 */
export function ContactSection() {
  const tel = SITE.phone.replace(/\./g, '')

  return (
    <section className="bg-shell py-14 md:py-20">
      <div className="container-site grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="gold-frame relative min-h-[360px] overflow-hidden rounded-[20px]">
          <Image
            src="/images/login-bg.jpg"
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 1024px) 100vw, 580px"
            className="object-cover object-[20%_60%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgb(4_30_29/0.88)_100%)]" />

          <ul className="absolute inset-x-0 bottom-0 z-10 space-y-3 p-7 text-sm text-white md:p-9">
            <li className="flex gap-3">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{SITE.address}</span>
            </li>
            <li className="flex gap-3">
              <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <a href={`tel:${tel}`} className="hover:text-accent">
                {SITE.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <a href={`mailto:${SITE.email}`} className="hover:text-accent">
                {SITE.email}
              </a>
            </li>
            <li className="flex gap-3">
              <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>Tư vấn 8h - 21h mỗi ngày</span>
            </li>
          </ul>
        </div>

        <div className="rounded-[20px] bg-white p-6 ring-1 ring-line md:p-10">
          <SectionHeading align="left" eyebrow="Liên hệ trực tuyến" title="Liên hệ tư vấn mua hàng" />
          <p className="mb-6 mt-3 text-sm text-muted">
            Vui lòng gọi{' '}
            <a href={`tel:${tel}`} className="font-semibold text-gold-ink hover:underline">
              {SITE.phone}
            </a>{' '}
            hoặc điền thông tin bên dưới, chúng tôi sẽ liên hệ lại sớm nhất.
          </p>
          <ContactForm />
        </div>
      </div>
    </section>
  )
}
