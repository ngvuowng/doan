import Image from 'next/image'
import Link from 'next/link'

export type Crumb = { label: string; href?: string }

/**
 * Banner tiêu đề + breadcrumb dùng chung cho mọi trang phụ, kiểu mẫu Bean: ảnh trái cây phủ lớp
 * xanh đen, tiêu đề serif trắng căn giữa, mục hiện tại của breadcrumb màu vàng.
 */
export function PageHeader({ title, crumbs = [] }: { title: string; crumbs?: Crumb[] }) {
  return (
    <div className="relative overflow-hidden bg-primary">
      <Image src="/images/login-bg.jpg" alt="" aria-hidden fill sizes="100vw" className="object-cover object-[50%_35%]" />
      <div className="absolute inset-0 bg-primary/80" />

      <div className="container-site relative py-12 text-center md:py-20">
        <h1 className="font-heading text-3xl font-medium text-white md:text-[44px] md:leading-tight">{title}</h1>
        <nav aria-label="Breadcrumb" className="mt-3 text-sm text-white/80">
          <ol className="flex flex-wrap items-center justify-center gap-2">
            <li>
              <Link href="/" className="transition-colors hover:text-accent">
                Trang chủ
              </Link>
            </li>
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1
              return (
                <li key={c.label} className="flex items-center gap-2">
                  <span aria-hidden className="text-accent">
                    /
                  </span>
                  {c.href && !last ? (
                    <Link href={c.href} className="transition-colors hover:text-accent">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-primary-light" aria-current={last ? 'page' : undefined}>
                      {c.label}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      </div>
    </div>
  )
}
