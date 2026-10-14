import Link from 'next/link'
import { ProductCard, type ProductCardData } from '@/components/shop/ProductCard'

type Props = {
  title: string
  subtitle?: string | null
  href?: string
  products: ProductCardData[]
  /** Biến thể nền xanh rừng, dùng cho section nước ép như bản gốc. */
  dark?: boolean
}

/** Khối sản phẩm theo danh mục ở trang chủ: tiêu đề + phụ đề + lưới 4/3/2 cột + "Xem thêm". */
export function ProductSection({ title, subtitle, href, products, dark }: Props) {
  if (products.length === 0) return null

  return (
    <section
      className={`py-14 ${
        dark ? 'bg-[linear-gradient(160deg,var(--color-primary),var(--color-primary-dark))] text-white' : ''
      }`}
    >
      <div className="container-site relative">
        <header className="mb-8 text-center">
          <h2 className={`section-title ${dark ? 'text-white' : ''}`}>{title}</h2>
          {subtitle && (
            <p className={`mt-3 text-sm ${dark ? 'text-white/70' : 'text-muted'}`}>{subtitle}</p>
          )}
        </header>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {href && (
          <div className="mt-10 text-center">
            <Link href={href} className={dark ? 'btn bg-white text-primary hover:bg-accent hover:text-white' : 'btn-outline'}>
              Xem thêm
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
