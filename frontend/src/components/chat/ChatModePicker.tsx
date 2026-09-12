'use client'

import { CHAT_MODES, type ChatMode } from '@/lib/chatModes'

type Props = { title: string; onPick: (mode: ChatMode) => void }

/**
 * Bảng chọn chủ đề, hiện như một lượt nói của trợ lý ở cuối khung chat. Dùng cho cả
 * lần mở đầu tiên lẫn khi khách bấm "Đổi chủ đề" giữa chừng, nên tiêu đề do cha quyết.
 */
export function ChatModePicker({ title, onPick }: Props) {
  return (
    <div className="space-y-2">
      <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-shell px-3 py-2 text-sm text-ink">
        {title}
      </p>
      <div role="group" aria-label="Chọn chủ đề tư vấn" className="grid gap-2">
        {CHAT_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            data-chat-mode={mode.id}
            onClick={() => onPick(mode.id)}
            className="rounded-lg border border-line px-3 py-2 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <span className="block text-sm font-medium text-ink">{mode.label}</span>
            <span className="block text-xs text-muted">{mode.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
