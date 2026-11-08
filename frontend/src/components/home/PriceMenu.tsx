import Image from 'next/image'
import Link from 'next/link'
import type { ProductCardData } from '@/components/shop/ProductCard'
import { SectionHeading } from '@/components/home/SectionHeading'
import { effectivePrice, formatPrice } from '@/lib/format'

export type PriceGroup = { name: string; slug: string; products: ProductCardData[] }

/** Số món mỗi nhóm trong bảng giá. */
const PER_GROUP = 4

/**
 * Bảng giá kiểu thực đơn của mẫu Bean: mỗi dòng là tên — hàng chấm vàng — giá. Desktop chia hai
 * cột hai bên một đĩa trái cây tròn viền vàng; mobile một cột, đĩa thu nhỏ lên đầu.
 * Dùng `<li>`, không dùng `<article>` (e2e đếm `<article>` để kiểm khối sản phẩm).
 */
export function PriceMenu({ groups }: { groups: PriceGroup[] }) {
  // Một sản phẩm có thể thuộc nhiều danh mục (4 sản phẩm gốc nằm ở cả 3 danh mục trang chủ):
  // mỗi món chỉ xuất hiện một lần, ở nhóm đầu tiên chứa nó.
  const seen = new Set<string>()
  const visible = groups
    .map((g) => {
      const products = g.products.filter((p) => !seen.has(p.id)).slice(0, PER_GROUP)
      products.forEach((p) => seen.add(p.id))
      return { ...g, products }
    })
    .filter((g) => g.products.length > 0)
  if (visible.length === 0) return null

  const half = Math.ceil(visible.length / 2)
  const columns = [visible.slice(0, half), visible.slice(half)]

  return (
    <section className="bg-shell py-14 md:py-20">
      <div className="container-site">
        <SectionHeading
          eyebrow="Hương vị được tuyển chọn"
          title="Bảng giá trái cây"
          description="Giá cập nhật theo ngày nhập hàng. Bấm vào tên để xem chi tiết và đặt mua."
          className="mb-10 md:mb-14"
        />

        {/* minmax(0, 1fr): tên món dài (nowrap + truncate) không được kéo giãn cột. */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-12">
          <div className="order-first mx-auto lg:order-none lg:col-start-2 lg:row-start-1 lg:self-center">
            <div className="relative aspect-square w-40 overflow-hidden rounded-full ring-2 ring-accent ring-offset-8 ring-offset-shell sm:w-52 lg:w-60">
              <Image
                src="/images/product-set-trai-cay-cat-san-07-loai-qua.jpg"
                alt=""
                aria-hidden
                fill
                sizes="240px"
                className="scale-[1.35] object-cover"
              />
            </div>
          </div>

          {columns.map((column, i) => (
            <div
              key={i}
              className={`space-y-10 ${i === 0 ? 'lg:col-start-1 lg:row-start-1' : 'lg:col-start-3 lg:row-start-1'}`}
            >
              {column.map((group) => (
                <div key={group.slug}>
                  <h3 className="mb-4 flex items-center gap-3 font-heading text-xl font-medium text-gold-ink md:text-2xl">
                    <Link href={`/danh-muc-san-pham/${group.slug}`} className="hover:text-primary">
                      {group.name}
                    </Link>
                    <span aria-hidden className="h-px flex-1 bg-accent/40" />
                  </h3>
                  <ul className="space-y-3.5">
                    {group.products.map((p) => (
                      <li key={p.id}>
                        <Link href={`/san-pham/${p.slug}`} className="group flex items-baseline text-[15px]">
                          <span className="min-w-0 truncate font-medium transition-colors group-hover:text-gold-ink">
                            {p.name}
                          </span>
                          <span aria-hidden className="dotted-leader" />
                          <span className="shrink-0 whitespace-nowrap">
                            {p.salePrice !== null && (
                              <span className="mr-2 text-xs text-muted line-through">{formatPrice(p.price)}</span>
                            )}
                            <span className="font-semibold text-sale">{formatPrice(effectivePrice(p))}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
