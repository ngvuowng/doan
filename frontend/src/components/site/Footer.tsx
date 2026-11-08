import Link from 'next/link'
import { api } from '@/lib/api'
import { ABOUT_LINKS, SITE } from '@/lib/site'
import { ClockIcon, FacebookIcon, MailIcon, MapPinIcon, PhoneIcon } from '@/components/site/icons'

const SUPPORT_LINKS = [
  { label: 'Tài khoản của tôi', href: '/tai-khoan' },
  { label: 'Tra cứu đơn hàng', href: '/tai-khoan/don-hang' },
  { label: 'Giỏ hàng', href: '/gio-hang' },
  { label: 'Liên hệ', href: '/lien-he' },
]

/**
 * Footer 4 cột kiểu mẫu Bean trên nền xanh đen: thương hiệu + liên hệ / Về chúng tôi / Tin tức /
 * Hỗ trợ khách hàng, dưới cùng là thanh bản quyền. Logo PNG có chữ xanh lá không đọc rõ trên nền
 * tối nên tên thương hiệu viết bằng chữ serif.
 */
export async function Footer() {
  const posts = await api.posts.list({ limit: 4 })
  const tel = SITE.phone.replace(/\./g, '')

  return (
    <footer className="mt-auto bg-primary-dark text-white/70 print:hidden">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1.2fr_1fr] lg:gap-12 lg:py-16">
        <section>
          <p className="font-heading text-[28px] leading-none font-medium text-white">
            Halona <span className="text-accent">Fruits</span>
          </p>
          <p className="mb-5 mt-4 text-sm leading-6">{SITE.description}</p>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{SITE.address}</span>
            </li>
            <li className="flex gap-3">
              <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-accent">
                {SITE.email}
              </a>
            </li>
          </ul>
          <a
            href={SITE.facebook}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Facebook"
            className="mt-5 grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white transition-colors hover:border-accent hover:bg-accent hover:text-primary-dark"
          >
            <FacebookIcon className="h-4 w-4" />
          </a>
        </section>

        <section>
          <h3 className={HEADING}>Về chúng tôi</h3>
          <ul className="space-y-2.5 text-sm">
            {ABOUT_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={LINK}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className={HEADING}>Tin tức</h3>
          <ul className="space-y-2.5 text-sm">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/tin-tuc/${p.slug}`} className={`${LINK} line-clamp-2 leading-6`}>
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className={HEADING}>Hỗ trợ khách hàng</h3>
          <a href={`tel:${tel}`} className="group mb-4 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-primary-dark">
              <PhoneIcon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs">Hotline đặt hàng</span>
              <span className="block font-heading text-xl text-white transition-colors group-hover:text-accent">
                {SITE.phone}
              </span>
            </span>
          </a>
          <p className="mb-4 flex items-center gap-2 text-sm">
            <ClockIcon className="h-4 w-4 shrink-0 text-accent" />
            Tư vấn 8h - 21h mỗi ngày
          </p>
          <ul className="space-y-2.5 text-sm">
            {SUPPORT_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={LINK}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="bg-primary">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-4 text-center text-xs sm:flex-row sm:text-left">
          <p>
            © Bản quyền thuộc về <span className="font-semibold text-accent">{SITE.name}</span>
          </p>
          <a href="#top" className="transition-colors hover:text-accent">
            Lên đầu trang ↑
          </a>
        </div>
      </div>
    </footer>
  )
}

const HEADING =
  'mb-5 font-heading text-lg font-medium text-white after:mt-2.5 after:block after:h-0.5 after:w-10 after:rounded-full after:bg-accent'
const LINK = 'transition-colors hover:text-accent'
