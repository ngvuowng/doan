import Link from 'next/link'

export type Crumb = { label: string; href?: string }

/** Dải tiêu đề + breadcrumb dùng chung cho mọi trang phụ. */
export function PageHeader({ title, crumbs = [] }: { title: string; crumbs?: Crumb[] }) {
  return (
    <div className="border-b border-line bg-shell">
      <div className="container-site py-7">
        <h1 className="font-heading text-2xl font-bold uppercase md:text-3xl">{title}</h1>
        <nav aria-label="Breadcrumb" className="mt-2 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-primary">
                Trang chủ
              </Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label} className="flex items-center gap-1.5">
                <span aria-hidden>/</span>
                {c.href ? (
                  <Link href={c.href} className="hover:text-primary">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  )
}
