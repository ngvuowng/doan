import type { Metadata } from 'next'
import { SITE } from '@/lib/site'
import { PageHeader } from '@/components/site/PageHeader'
import { ContactForm } from '@/components/site/ContactForm'
import { FacebookIcon, MailIcon, MapPinIcon, PhoneIcon } from '@/components/site/icons'

export const metadata: Metadata = {
  title: 'Liên hệ',
  description: `Liên hệ ${SITE.name} - ${SITE.address} - ${SITE.phone}`,
}

export default function ContactPage() {
  return (
    <>
      <PageHeader title="Liên hệ" crumbs={[{ label: 'Liên hệ' }]} />

      <div className="container-site py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 font-heading text-lg font-bold uppercase">Thông tin liên hệ</h2>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <MapPinIcon className="h-5 w-5" />
                </span>
                <span>
                  <strong className="block">Địa chỉ</strong>
                  <span className="text-muted">{SITE.address}</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <PhoneIcon className="h-5 w-5" />
                </span>
                <span>
                  <strong className="block">Điện thoại</strong>
                  <a href={`tel:${SITE.phone.replace(/\./g, '')}`} className="text-muted hover:text-primary">
                    {SITE.phone}
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <MailIcon className="h-5 w-5" />
                </span>
                <span>
                  <strong className="block">Email</strong>
                  <a href={`mailto:${SITE.email}`} className="text-muted hover:text-primary">
                    {SITE.email}
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <FacebookIcon className="h-5 w-5" />
                </span>
                <span>
                  <strong className="block">Facebook</strong>
                  <a
                    href={SITE.facebook}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-muted hover:text-primary"
                  >
                    fb.com/facebook
                  </a>
                </span>
              </li>
            </ul>

            <div className="mt-6 overflow-hidden rounded-lg border border-line">
              <iframe
                title="Bản đồ đường đi tới Halona Fruits"
                src="https://www.google.com/maps?q=Ph%E1%BA%A1m%20V%C4%83n%20B%E1%BA%A1ch,%20P.%2015,%20T%C3%A2n%20B%C3%ACnh,%20H%E1%BB%93%20Ch%C3%AD%20Minh&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-64 w-full border-0"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-heading text-lg font-bold uppercase">Gửi liên hệ</h2>
            <ContactForm />
          </section>
        </div>
      </div>
    </>
  )
}
