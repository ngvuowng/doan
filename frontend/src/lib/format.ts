/** Định dạng tiền Việt theo bản gốc: "180.000₫" (dấu chấm phân cách nghìn). */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}₫`
}

/** Khoảng cách tới cửa hàng: "2,3 km" (dấu phẩy thập phân theo tiếng Việt). */
export function formatDistance(km: number): string {
  return `${km.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km`
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

/** Tiền rút gọn cho trục biểu đồ: "350k", "1,2 tr", "1,5 tỷ". */
export function formatCompactPrice(amount: number): string {
  const abs = Math.abs(amount)
  const short = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
  if (abs >= 1e9) return `${short(amount / 1e9)} tỷ`
  if (abs >= 1e6) return `${short(amount / 1e6)} tr`
  if (abs >= 1e3) return `${short(amount / 1e3)}k`
  return String(amount)
}

/** Tỉ lệ 0..1 thành "12,5%". */
export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toLocaleString('vi-VN', { maximumFractionDigits: digits })}%`
}

/**
 * Ngày "YYYY-MM-DD" từ API thành "13/10/2026". Tách chuỗi thay vì `new Date(...)` vì
 * chuỗi chỉ có ngày bị hiểu là nửa đêm UTC và có thể lệch một ngày khi đổi múi giờ.
 */
export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}
