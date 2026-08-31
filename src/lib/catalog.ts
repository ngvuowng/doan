import type { Prisma } from '@prisma/client'

/** Các trường tối thiểu để render card sản phẩm. */
export const PRODUCT_CARD_SELECT = {
  id: true,
  slug: true,
  name: true,
  price: true,
  salePrice: true,
  image: true,
  hoverImage: true,
} as const

export const PAGE_SIZE = 12

/** Ánh xạ giá trị `?sap-xep=` sang mệnh đề orderBy của Prisma. */
export function sortToOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case 'gia-tang':
      return { price: 'asc' }
    case 'gia-giam':
      return { price: 'desc' }
    case 'ten':
      return { name: 'asc' }
    default:
      return { createdAt: 'asc' }
  }
}

/** Đọc `?trang=` thành số trang hợp lệ (>= 1). */
export function parsePage(value?: string): number {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : 1
}
