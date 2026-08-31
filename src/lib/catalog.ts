export const PAGE_SIZE = 12

/** Đọc `?trang=` thành số trang hợp lệ (>= 1). */
export function parsePage(value?: string): number {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : 1
}
