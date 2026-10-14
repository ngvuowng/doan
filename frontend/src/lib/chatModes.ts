/**
 * Bốn mảng tư vấn của trợ lý ảo. Khách không còn phải chọn chủ đề trước khi hỏi — khung
 * chat chỉ lấy mỗi mảng một câu mẫu làm gợi ý, còn trang quản trị dùng nhãn ngắn cho các
 * tin cũ có lưu `mode` (backend/app/chat_modes.py — hai danh sách phải khớp nhau). File
 * này không import `server-only` để cả khung chat (client) lẫn trang quản trị (server)
 * đều dùng được.
 */

export const CHAT_MODE_IDS = ['product', 'advice', 'storage', 'recipe'] as const

export type ChatMode = (typeof CHAT_MODE_IDS)[number]

export type ChatModeInfo = {
  id: ChatMode
  /** Nhãn ở trang quản trị. */
  shortLabel: string
  /** Câu hỏi gợi ý dưới lời chào của khung chat, bấm là gửi luôn. */
  example: string
}

export const CHAT_MODES: readonly ChatModeInfo[] = [
  {
    id: 'product',
    shortLabel: 'Sản phẩm',
    example: 'Loại quả nào đang giảm giá?',
  },
  {
    id: 'advice',
    shortLabel: 'Tư vấn chọn quả',
    example: 'Mình cần giỏ quả biếu tặng khoảng 500.000₫',
  },
  {
    id: 'storage',
    shortLabel: 'Bảo quản',
    example: 'Táo để tủ lạnh được bao lâu?',
  },
  {
    id: 'recipe',
    shortLabel: 'Công thức',
    example: 'Gợi ý sinh tố từ trái cây mình vừa mua',
  },
]

/** Tra thông tin chủ đề theo id; chuỗi lạ (tin cũ, dữ liệu hỏng) trả về null. */
export function chatModeInfo(id: string | null | undefined): ChatModeInfo | null {
  return CHAT_MODES.find((m) => m.id === id) ?? null
}
