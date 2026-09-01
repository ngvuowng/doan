'use server'

import { z } from 'zod'
import {
  api,
  ApiError,
  type ChatHistory,
  type ChatMessage,
  type ProductCard,
} from '@/lib/api'
import type { FormState } from '@/lib/validation'

/**
 * Kết quả một lượt hỏi trợ lý. Mở rộng `FormState` để giữ đúng quy ước lỗi chung của
 * dự án (`formError` là chuỗi tiếng Việt lấy từ `ApiError.detail`), nhưng mang thêm
 * câu trả lời — khung chat cần dữ liệu trả về chứ không chỉ cần trạng thái form.
 */
export type ChatState = FormState & {
  sessionId?: string
  reply?: ChatMessage
  suggestions?: ProductCard[]
}

const schema = z.object({
  clientKey: z.string().trim().min(8).max(64),
  message: z
    .string()
    .trim()
    .min(1, 'Bạn nhập câu hỏi trước nhé')
    .max(1000, 'Câu hỏi dài quá, bạn rút gọn dưới 1000 ký tự giúp mình nhé'),
})

/**
 * Cầu nối duy nhất giữa khung chat (client component) và FastAPI: `api.ts` được đánh
 * dấu `server-only` nên trình duyệt không import được, còn dự án thì không dùng Route
 * Handler. Next dựng sẵn một endpoint RPC cho hàm `'use server'` này, client chỉ cầm
 * tham chiếu tới nó — nhờ vậy JWT trong cookie httpOnly không bao giờ rời máy chủ.
 */
export async function sendChatMessage(clientKey: string, message: string): Promise<ChatState> {
  const parsed = schema.safeParse({ clientKey, message })
  if (!parsed.success) return { formError: parsed.error.issues[0].message }

  try {
    const data = await api.chat.send(parsed.data)
    return {
      success: true,
      sessionId: data.sessionId,
      reply: data.reply,
      suggestions: data.suggestions,
    }
  } catch (error) {
    if (error instanceof ApiError) return { formError: error.detail }
    throw error
  }
}

export async function loadChatHistory(clientKey: string): Promise<ChatHistory> {
  try {
    return await api.chat.history(clientKey)
  } catch (error) {
    // Lịch sử hỏng không được chặn khách hỏi câu mới — coi như bắt đầu lại từ đầu.
    if (error instanceof ApiError) return { sessionId: null, messages: [] }
    throw error
  }
}

export async function clearChatHistory(clientKey: string): Promise<void> {
  try {
    await api.chat.clear(clientKey)
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
  }
}
