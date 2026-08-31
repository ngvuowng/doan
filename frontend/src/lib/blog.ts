import { api } from '@/lib/api'

/** Dữ liệu dùng chung cho sidebar của khu vực tin tức. */
export function getSidebarData() {
  return Promise.all([api.categories.list('post'), api.posts.list({ limit: 4 })])
}
