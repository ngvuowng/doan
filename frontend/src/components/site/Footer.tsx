import Link from 'next/link'
import { api } from '@/lib/api'
import { ABOUT_LINKS, SITE } from '@/lib/site'
import { FacebookIcon, MailIcon, MapPinIcon, PhoneIcon } from '@/components/site/icons'

/**
 * Footer 3 cột theo bản gốc: Liên hệ / Tin tức / Về chúng tôi.
 * Bản gốc dùng ảnh nền phủ lớp đen rgba(0,0,0,.605); ảnh đó không có trong bản
 * lưu trữ nên thay bằng gradient tối cùng tông.
 */
export async function Footer() {
  const posts = await api.posts.list({ limit: 4 })

  return (
    <footer className="mt-auto bg-[linear-gradient(160deg,#1d2b12,#0f1a08)] text-neutral-300">
      <div className="container-site grid gap-10 py-14 md:grid-cols-3">
        <section>
          <h3 className="mb-4 font-heading text-base font-bold uppercase text-white">Liên hệ</h3>
          <p className="mb-5 text-sm leading-6">{SITE.description}</p>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
              <span>{SITE.address}</span>
            </li>
            <li className="flex gap-3">
              <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
              <a href={`tel:${SITE.phone.replace(/\./g, '')}`} className="hover:text-white">
                {SITE.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
              <a href={`mailto:${SITE.email}`} className="hover:text-white">
                {SITE.email}
              </a>
            </li>
            <li className="flex gap-3">
              <FacebookIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
              <a
                href={SITE.facebook}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-white"
              >
                fb.com/facebook
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-4 font-heading text-base font-bold uppercase text-white">Tin tức</h3>
          <ul className="space-y-3 text-sm">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/tin-tuc/${p.slug}`} className="leading-6 hover:text-primary-light">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-4 font-heading text-base font-bold uppercase text-white">
            Về chúng tôi
          </h3>
          <ul className="space-y-3 text-sm">
            {ABOUT_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-primary-light">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-5 text-xs md:flex-row">
          <p>© Bản quyền thuộc về {SITE.name}</p>
          <a href="#top" className="hover:text-white">
            Lên đầu trang ↑
          </a>
        </div>
      </div>
    </footer>
  )
}
