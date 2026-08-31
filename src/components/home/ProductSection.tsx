import Link from 'next/link'
import { ProductCard, type ProductCardData } from '@/components/shop/ProductCard'

type Props = {
  title: string
  subtitle?: string | null
  href?: string
  products: ProductCardData[]
  /** Biến thể nền tối có lớp phủ, dùng cho section "Các loại nước ép" như bản gốc. */
  dark?: boolean
}

/** Khối sản phẩm theo danh mục ở trang chủ: tiêu đề + phụ đề + lưới 4/3/2 cột + "Xem thêm". */
export function ProductSection({ title, subtitle, href, products, dark }: Props) {
  if (products.length === 0) return null

  return (
    <section className={`py-12 ${dark ? 'relative bg-ink text-white' : ''}`}>
      {dark && <div className="absolute inset-0 bg-[linear-gradient(160deg,#26350f,#0f1a08)]" />}

      <div className="container-site relative">
        <header className="mb-8 text-center">
          <h2 className={`section-title ${dark ? 'text-white' : ''}`}>{title}</h2>
          {subtitle && (
            <p className={`mt-3 text-sm ${dark ? 'text-neutral-300' : 'text-muted'}`}>{subtitle}</p>
          )}
        </header>

        <div
          className={`grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 ${
            dark ? '[&_.old-price]:text-neutral-400 [&_h3_a]:text-white' : ''
          }`}
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {href && (
          <div className="mt-10 text-center">
            <Link href={href} className={dark ? 'btn bg-white text-primary hover:bg-primary hover:text-white' : 'btn-outline'}>
              Xem thêm
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
