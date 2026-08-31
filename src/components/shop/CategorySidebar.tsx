import Link from 'next/link'

type Category = { slug: string; name: string; _count: { products: number } }

/** Cột danh mục bên trái ở trang cửa hàng. */
export function CategorySidebar({
  categories,
  activeSlug,
}: {
  categories: Category[]
  activeSlug?: string
}) {
  return (
    <aside className="lg:w-60 lg:shrink-0">
      <h2 className="mb-3 font-heading text-base font-bold uppercase">Danh mục sản phẩm</h2>
      <ul className="space-y-1 text-sm">
        <li>
          <Link
            href="/cua-hang"
            className={`flex items-center justify-between rounded-md px-3 py-2 transition-colors ${
              !activeSlug ? 'bg-primary text-white' : 'hover:bg-shell hover:text-primary'
            }`}
          >
            Tất cả sản phẩm
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/danh-muc-san-pham/${c.slug}`}
              className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 transition-colors ${
                activeSlug === c.slug ? 'bg-primary text-white' : 'hover:bg-shell hover:text-primary'
              }`}
            >
              <span>{c.name}</span>
              <span className={activeSlug === c.slug ? 'text-white/80' : 'text-muted'}>
                ({c._count.products})
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
