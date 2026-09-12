/**
 * Bốn chủ đề tư vấn của trợ lý ảo. Khách bấm chọn một chủ đề trước khi gõ câu hỏi;
 * backend ghép system prompt riêng theo `id` (backend/app/chat_modes.py — hai danh sách
 * phải khớp nhau). File này không import `server-only` để cả khung chat (client) lẫn
 * trang quản trị (server) đều dùng được.
 */

export const CHAT_MODE_IDS = ['product', 'advice', 'storage', 'recipe'] as const

export type ChatMode = (typeof CHAT_MODE_IDS)[number]

export type ChatModeInfo = {
  id: ChatMode
  /** Tên trên nút chọn chủ đề. */
  label: string
  /** Tên ngắn cho tiêu đề khung chat và nhãn ở trang quản trị. */
  shortLabel: string
  /** Dòng phụ dưới tên nút, nói rõ chủ đề này trả lời được gì. */
  description: string
  /** Placeholder của ô nhập sau khi chọn. */
  placeholder: string
  /** Bong bóng trợ lý hiện ngay sau khi chọn, trước khi khách gõ. */
  intro: string
  /** Ba câu hỏi mẫu, bấm là gửi luôn. */
  examples: readonly [string, string, string]
}

export const CHAT_MODES: readonly ChatModeInfo[] = [
  {
    id: 'product',
    label: 'Giải đáp về sản phẩm',
    shortLabel: 'Sản phẩm',
    description: 'Giá, khuyến mãi, còn hàng, xuất xứ của các mặt hàng đang bán',
    placeholder: 'Hỏi về giá, khuyến mãi, còn hàng...',
    intro: 'Bạn muốn biết gì về sản phẩm của Halona? Mình tra cứu giá và tình trạng hàng ngay.',
    examples: [
      'Loại quả nào đang giảm giá?',
      'Táo nhập khẩu giá bao nhiêu?',
      'Cửa hàng có bán nước ép không?',
    ],
  },
  {
    id: 'advice',
    label: 'Tư vấn chọn hoa quả',
    shortLabel: 'Tư vấn chọn quả',
    description: 'Chọn loại quả hợp nhu cầu: biếu tặng, cho bé, ăn kiêng, theo ngân sách',
    placeholder: 'Mua cho ai, dịp gì, ngân sách bao nhiêu?',
    intro: 'Bạn cho mình biết mua cho ai, dịp gì và ngân sách khoảng bao nhiêu nhé.',
    examples: [
      'Mình cần giỏ quả biếu tặng khoảng 500.000₫',
      'Quả nào hợp cho bé 2 tuổi?',
      'Quả nào ít ngọt cho người ăn kiêng?',
    ],
  },
  {
    id: 'storage',
    label: 'Bảo quản và sử dụng',
    shortLabel: 'Bảo quản',
    description: 'Cách cất giữ, rửa, gọt và nhận biết quả chín hay hỏng',
    placeholder: 'Bạn muốn bảo quản loại quả nào?',
    intro: 'Bạn muốn bảo quản hay dùng loại quả nào? Mình hướng dẫn cách giữ tươi lâu.',
    examples: [
      'Táo để tủ lạnh được bao lâu?',
      'Vải mua về nên bảo quản thế nào?',
      'Cà chua chín để đâu cho lâu hỏng?',
    ],
  },
  {
    id: 'recipe',
    label: 'Gợi ý công thức',
    shortLabel: 'Công thức',
    description: 'Món ăn, nước ép, sinh tố từ hoa quả bạn đã mua',
    placeholder: 'Bạn có loại quả nào, muốn làm món gì?',
    intro: 'Bạn đang có loại quả nào, muốn làm nước ép, sinh tố hay món gì? Mình gợi ý công thức nhé.',
    examples: [
      'Gợi ý sinh tố từ trái cây mình vừa mua',
      'Làm nước ép táo cà chua thế nào?',
      'Món tráng miệng từ vải?',
    ],
  },
]

/** Tra thông tin chủ đề theo id; chuỗi lạ (tin cũ, dữ liệu hỏng) trả về null. */
export function chatModeInfo(id: string | null | undefined): ChatModeInfo | null {
  return CHAT_MODES.find((m) => m.id === id) ?? null
}
