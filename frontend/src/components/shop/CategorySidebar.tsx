import Link from 'next/link'
import type { CategoryNode } from '@/lib/catalog'

type Category = { slug: string; name: string; productCount: number }

/** Cột danh mục bên trái ở trang cửa hàng: danh mục gốc rồi các cấp con thụt dần vào. */
export function CategorySidebar({
  categories,
  activeSlug,
}: {
  categories: CategoryNode[]
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
        <CategoryBranch nodes={categories} activeSlug={activeSlug} depth={0} />
      </ul>
    </aside>
  )
}

/** Nhánh cây danh mục, đệ quy mọi độ sâu; cấp 0 in đậm, cấp dưới thụt vào có vạch trái. */
function CategoryBranch({
  nodes,
  activeSlug,
  depth,
}: {
  nodes: CategoryNode[]
  activeSlug?: string
  depth: number
}) {
  return nodes.map((node) => (
    <li key={node.slug}>
      <CategoryRow category={node} active={activeSlug === node.slug} parent={depth === 0} />
      {node.children.length > 0 && (
        <ul className="ml-3 mt-1 space-y-1 border-l border-line pl-2">
          <CategoryBranch nodes={node.children} activeSlug={activeSlug} depth={depth + 1} />
        </ul>
      )}
    </li>
  ))
}

/** Một hàng danh mục; `productCount` của danh mục cha đã gồm sản phẩm của các con (API gom sẵn). */
function CategoryRow({
  category,
  active,
  parent,
}: {
  category: Category
  active: boolean
  parent?: boolean
}) {
  return (
    <Link
      href={`/danh-muc-san-pham/${category.slug}`}
      className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 transition-colors ${
        active ? 'bg-primary text-white' : 'hover:bg-shell hover:text-primary'
      } ${parent ? 'font-medium' : ''}`}
    >
      <span>{category.name}</span>
      <span className={active ? 'text-white/80' : 'text-muted'}>({category.productCount})</span>
    </Link>
  )
}
