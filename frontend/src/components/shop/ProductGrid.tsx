import { ProductCard, type ProductCardData } from '@/components/shop/ProductCard'

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-muted">Không tìm thấy sản phẩm nào phù hợp.</p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
