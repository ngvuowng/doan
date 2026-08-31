import Link from 'next/link'

type Props = {
  categories: { slug: string; name: string; postCount: number }[]
  recent: { slug: string; title: string }[]
  activeSlug?: string
}

export function PostSidebar({ categories, recent, activeSlug }: Props) {
  return (
    <aside className="space-y-8 lg:w-64 lg:shrink-0">
      <section>
        <h2 className="mb-3 font-heading text-base font-bold uppercase">Chuyên mục</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <Link
              href="/tin-tuc"
              className={`block rounded-md px-3 py-2 transition-colors ${
                !activeSlug ? 'bg-primary text-white' : 'hover:bg-shell hover:text-primary'
              }`}
            >
              Tất cả bài viết
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/chuyen-muc/${c.slug}`}
                className={`flex items-center justify-between rounded-md px-3 py-2 transition-colors ${
                  activeSlug === c.slug ? 'bg-primary text-white' : 'hover:bg-shell hover:text-primary'
                }`}
              >
                <span>{c.name}</span>
                <span className={activeSlug === c.slug ? 'text-white/80' : 'text-muted'}>
                  ({c.postCount})
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-heading text-base font-bold uppercase">Bài viết mới</h2>
        <ul className="space-y-2.5 text-sm">
          {recent.map((p) => (
            <li key={p.slug}>
              <Link href={`/tin-tuc/${p.slug}`} className="leading-6 hover:text-primary">
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
