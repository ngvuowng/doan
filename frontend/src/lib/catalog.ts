// Chỉ import kiểu: api.ts có 'server-only', còn file này được cả client component dùng.
import type { CategoryWithCount } from '@/lib/api'

export const PAGE_SIZE = 12

/** Đọc `?trang=` thành số trang hợp lệ (>= 1). */
export function parsePage(value?: string): number {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : 1
}

type TreeItem = { id: string; parentId: string | null }
export type CategoryNode<T extends TreeItem = CategoryWithCount> = T & { children: CategoryNode<T>[] }

/**
 * Dựng cây sâu tuỳ ý từ danh sách phẳng đã sắp theo `position` (backend trả cha trước con,
 * nên thứ tự anh em được giữ nguyên). Gốc = `parentId` null; con không tìm thấy cha (dữ liệu
 * lệch) được coi như gốc để không mất.
 */
export function buildCategoryTree<T extends TreeItem>(items: T[]): CategoryNode<T>[] {
  const nodes = new Map<string, CategoryNode<T>>()
  for (const item of items) nodes.set(item.id, { ...item, children: [] })
  const roots: CategoryNode<T>[] = []
  for (const node of nodes.values()) {
    const parent = node.parentId === null ? undefined : nodes.get(node.parentId)
    ;(parent ?? { children: roots }).children.push(node)
  }
  return roots
}

/**
 * Tổ tiên của một danh mục, từ gốc xuống cha trực tiếp (không gồm chính nó), tra trong danh
 * sách đã tải. Chặn ở 10 cấp để dữ liệu lệch (parentId tạo vòng) không treo render.
 */
export function ancestorsOf<T extends TreeItem>(category: TreeItem, items: T[]): T[] {
  const byId = new Map(items.map((c) => [c.id, c]))
  const chain: T[] = []
  for (let parentId = category.parentId; parentId !== null && chain.length < 10; ) {
    const parent = byId.get(parentId)
    if (!parent) break
    chain.unshift(parent)
    parentId = parent.parentId
  }
  return chain
}
