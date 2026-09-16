// Chỉ import kiểu: api.ts có 'server-only', còn file này được cả client component dùng.
import type { CategoryWithCount } from '@/lib/api'

export const PAGE_SIZE = 12

/** Đọc `?trang=` thành số trang hợp lệ (>= 1). */
export function parsePage(value?: string): number {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : 1
}

type TreeItem = { id: string; parentId: string | null }
export type CategoryNode<T extends TreeItem = CategoryWithCount> = T & { children: T[] }

/**
 * Dựng cây hai cấp từ danh sách phẳng đã sắp theo `position` (backend trả cha rồi con).
 * Gốc = `parentId` null. Con không tìm thấy cha (dữ liệu lệch) được coi như gốc để không mất.
 */
export function buildCategoryTree<T extends TreeItem>(items: T[]): CategoryNode<T>[] {
  const roots = new Map<string, CategoryNode<T>>()
  for (const item of items) {
    if (item.parentId === null) roots.set(item.id, { ...item, children: [] })
  }
  for (const item of items) {
    if (item.parentId === null) continue
    const parent = roots.get(item.parentId)
    if (parent) parent.children.push(item)
    else roots.set(item.id, { ...item, children: [] })
  }
  return [...roots.values()]
}
