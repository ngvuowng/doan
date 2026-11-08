import Link from 'next/link'
import { ProductCard, type ProductCardData } from '@/components/shop/ProductCard'
import { SectionHeading } from '@/components/home/SectionHeading'

type Props = {
  title: string
  eyebrow?: string
  subtitle?: string | null
  href?: string
  products: ProductCardData[]
  /** Nền kem đậm hơn để tách khối với khối liền kề. */
  tinted?: boolean
}

/** Khối sản phẩm theo danh mục ở trang chủ: phụ đề vàng + tiêu đề serif + lưới 4/3/2 cột + "Xem tất cả". */
export function ProductSection({ title, eyebrow, subtitle, href, products, tinted }: Props) {
  if (products.length === 0) return null

  return (
    <section className={`py-14 md:py-20 ${tinted ? 'bg-shell' : ''}`}>
      <div className="container-site">
        <SectionHeading eyebrow={eyebrow} title={title} description={subtitle} className="mb-8 md:mb-10" />

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {href && (
          <div className="mt-10 text-center">
            <Link href={href} className="btn-outline">
              Xem tất cả
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
