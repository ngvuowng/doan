/** Định dạng tiền Việt theo bản gốc: "180.000₫" (dấu chấm phân cách nghìn). */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}₫`
}

/** Phần trăm giảm giá làm tròn, dùng cho badge "-25%" trên card sản phẩm. */
export function discountPercent(price: number, salePrice: number | null): number | null {
  if (!salePrice || salePrice >= price) return null
  return Math.round((1 - salePrice / price) * 100)
}

/** Giá thực tế khách phải trả. */
export function effectivePrice(product: { price: number; salePrice: number | null }): number {
  return product.salePrice ?? product.price
}

const DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatDate(date: Date | string): string {
  return DATE_FORMATTER.format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
