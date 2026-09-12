'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { clearChatHistory, loadChatHistory, sendChatMessage } from '@/actions/chat'
import type { ChatMessage, ProductCard } from '@/lib/api'
import { chatModeInfo, type ChatMode } from '@/lib/chatModes'
import { useCart } from '@/components/cart/CartProvider'
import { ChatModePicker } from '@/components/chat/ChatModePicker'
import { SendIcon, XIcon } from '@/components/site/icons'
import { effectivePrice, formatPrice } from '@/lib/format'

const GREETING =
  'Chào bạn! Mình là trợ lý của Halona Fruist. Bạn chọn chủ đề bên dưới để mình hỗ trợ đúng ý nhé.'

const MAX_LENGTH = 1000

type Props = { clientKey: string; onClose: () => void }

export function ChatPanel({ clientKey, onClose }: Props) {
  const { items: cartLines } = useCart()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [suggestions, setSuggestions] = useState<ProductCard[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isSending, setIsSending] = useState(false)
  // Chủ đề khách đang chọn. null = đang hiện bảng chọn, ô nhập bị khoá.
  const [mode, setMode] = useState<ChatMode | null>(null)
  // Bong bóng giới thiệu chủ đề vừa chọn. Không đưa vào `messages` vì nó không được lưu
  // ở backend, và để nút "Xoá trò chuyện" chỉ hiện khi đã có tin nhắn thật.
  const [showIntro, setShowIntro] = useState(false)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  // Giữ câu vừa gửi để nút "Thử lại" không phải bắt khách gõ lại.
  const lastAsked = useRef('')

  const modeInfo = chatModeInfo(mode)

  // Tải lịch sử khi panel được dựng, tức là lần đầu khách mở khung chat. Người chưa
  // bao giờ mở thì mỗi lần tải trang không tốn thêm một vòng gọi API nào.
  useEffect(() => {
    let cancelled = false
    loadChatHistory(clientKey).then((data) => {
      if (cancelled) return
      setMessages(data.messages)
      // Khôi phục chủ đề của lượt hỏi gần nhất: panel bị huỷ khi đóng, không nhớ được
      // gì, nên nếu không đọc lại từ lịch sử thì mở lại là khách phải chọn lại từ đầu.
      const last = data.messages.findLast((m) => m.role === 'user' && chatModeInfo(m.mode))
      if (last?.mode) setMode(last.mode)
      setIsLoadingHistory(false)
    })
    return () => {
      cancelled = true
    }
  }, [clientKey])

  // Chỉ focus khi đã có chủ đề — textarea đang disabled thì không nhận focus.
  useEffect(() => {
    if (mode) inputRef.current?.focus()
  }, [mode])

  // Escape đóng khung chat, giống ngăn kéo giỏ hàng.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, isSending, error, mode, showIntro])

  // Chỉ khoá cuộn nền dưới 640px, nơi khung chat chiếm trọn màn hình. Trên desktop đây
  // là cửa sổ phụ trợ nên khách vẫn phải xem được sản phẩm phía sau khi đang hỏi.
  useEffect(() => {
    if (!window.matchMedia('(max-width: 639px)').matches) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const ask = useCallback(
    async (question: string) => {
      const value = question.trim()
      if (!value || isSending || !mode) return

      lastAsked.current = value
      setText('')
      setError(null)
      setSuggestions([])
      setShowIntro(false)
      // Bong bóng của khách hiện ngay, không chờ máy chủ trả lời.
      setMessages((current) => [
        ...current,
        {
          id: `tam-${Date.now()}`,
          role: 'user',
          content: value,
          mode,
          createdAt: new Date().toISOString(),
        },
      ])
      setIsSending(true)

      // Chủ đề công thức gửi kèm tên hàng trong giỏ để trợ lý gợi ý đúng từ những gì
      // khách đang có; các chủ đề khác không cần nên không gửi.
      const cartItems = mode === 'recipe' ? cartLines.slice(0, 20).map((line) => line.name) : []
      const result = await sendChatMessage(clientKey, value, mode, cartItems)
      setIsSending(false)

      if (result.reply) {
        setMessages((current) => [...current, result.reply!])
        setSuggestions(result.suggestions ?? [])
      } else {
        setError(result.formError ?? 'Có lỗi xảy ra. Bạn thử lại giúp mình nhé.')
      }
    },
    [clientKey, isSending, mode, cartLines],
  )

  const chooseMode = useCallback((next: ChatMode) => {
    setMode(next)
    setShowIntro(true)
    setError(null)
    setSuggestions([])
  }, [])

  // Quay lại bảng chọn nhưng giữ nguyên lịch sử: khách hỏi tiếp ở chủ đề khác vẫn
  // thấy được những gì đã trao đổi.
  const switchMode = useCallback(() => {
    setMode(null)
    setShowIntro(false)
    setError(null)
  }, [])

  const clearAll = useCallback(async () => {
    setMessages([])
    setSuggestions([])
    setError(null)
    setMode(null)
    setShowIntro(false)
    await clearChatHistory(clientKey)
  }, [clientKey])

  const isEmpty = !isLoadingHistory && messages.length === 0

  // Chủ đề công thức: nói cho khách biết trợ lý đã thấy giỏ hàng, khỏi phải kể lại.
  const cartNames = cartLines.map((line) => line.name)
  const introText =
    modeInfo?.id === 'recipe' && cartNames.length > 0
      ? `Mình thấy giỏ của bạn đang có: ${cartNames.join(', ')}. ${modeInfo.intro}`
      : modeInfo?.intro

  return (
    <section
      id="halona-chat-panel"
      role="dialog"
      aria-label="Trợ lý tư vấn Halona"
      className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[560px] sm:w-[380px] sm:rounded-xl sm:border sm:border-line sm:shadow-2xl"
    >
      <header className="flex items-center justify-between gap-2 bg-primary px-4 py-3 text-white sm:rounded-t-xl">
        <div>
          <h2 className="font-heading text-base font-bold uppercase">Trợ lý Halona</h2>
          <p className="text-xs text-white/80">
            {modeInfo ? `Chủ đề: ${modeInfo.shortLabel}` : 'Tư vấn hoa quả · trả lời trong vài giây'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {modeInfo && (
            <button
              type="button"
              data-chat-switch
              onClick={switchMode}
              disabled={isSending}
              className="rounded px-2 py-1 text-xs underline-offset-2 hover:underline disabled:opacity-50"
            >
              Đổi chủ đề
            </button>
          )}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded px-2 py-1 text-xs underline-offset-2 hover:underline"
            >
              Xoá trò chuyện
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Đóng trợ lý tư vấn" className="p-1">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {isLoadingHistory ? (
          <p className="text-sm text-muted">Đang tải cuộc trò chuyện...</p>
        ) : (
          <>
            {isEmpty && (
              <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-shell px-3 py-2 text-sm text-ink">
                {GREETING}
              </p>
            )}

            {messages.map((message) => (
              <p
                key={message.id}
                data-role={message.role}
                className={
                  message.role === 'user'
                    ? 'ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-white'
                    : 'max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-shell px-3 py-2 text-sm text-ink'
                }
              >
                {message.content}
              </p>
            ))}

            {suggestions.length > 0 && (
              <ul className="space-y-2">
                {suggestions.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/san-pham/${product.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-lg border border-line p-2 transition-colors hover:border-primary"
                    >
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-line bg-white">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-contain p-0.5"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {product.name}
                        </span>
                        <span className="block text-sm font-bold text-primary">
                          {formatPrice(effectivePrice(product))}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* Bảng chọn nằm cuối log nên dùng được cho cả lần mở đầu lẫn khi đổi chủ đề. */}
            {mode === null && !isSending && (
              <ChatModePicker
                title={isEmpty ? 'Bạn cần mình giúp gì hôm nay?' : 'Bạn muốn đổi sang chủ đề nào?'}
                onPick={chooseMode}
              />
            )}

            {modeInfo && showIntro && (
              <>
                <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-shell px-3 py-2 text-sm text-ink">
                  {introText}
                </p>
                <ul className="flex flex-wrap gap-2 pt-1">
                  {modeInfo.examples.map((question) => (
                    <li key={question}>
                      <button
                        type="button"
                        onClick={() => ask(question)}
                        className="rounded-full border border-line px-3 py-1.5 text-xs text-ink transition-colors hover:border-primary hover:text-primary"
                      >
                        {question}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {isSending && (
              <p className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm bg-shell px-3 py-3">
                <span className="sr-only">Trợ lý đang soạn câu trả lời...</span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
              </p>
            )}

            {error && (
              <div
                data-chat-error
                className="space-y-2 rounded-2xl rounded-bl-sm bg-sale/10 px-3 py-2 text-sm text-sale"
              >
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => ask(lastAsked.current)}
                  className="font-medium underline underline-offset-2"
                >
                  Thử lại
                </button>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          ask(text)
        }}
        className="border-t border-line p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            id="halona-chat-input"
            ref={inputRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              // Enter gửi, Shift+Enter xuống dòng — thói quen của mọi khung chat.
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                ask(text)
              }
            }}
            rows={1}
            maxLength={MAX_LENGTH}
            disabled={!mode}
            aria-label="Nhập câu hỏi cho trợ lý"
            placeholder={modeInfo?.placeholder ?? 'Chọn chủ đề ở trên trước nhé...'}
            className="max-h-24 flex-1 resize-none rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary disabled:bg-shell disabled:text-muted"
          />
          <button
            type="submit"
            disabled={isSending || !mode || text.trim().length === 0}
            aria-label="Gửi câu hỏi"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>
        {text.length > 900 && (
          <p className="pt-1 text-right text-xs text-muted">
            {text.length}/{MAX_LENGTH}
          </p>
        )}
        <p className="pt-2 text-center text-[11px] leading-tight text-muted">
          Trợ lý có thể trả lời chưa chính xác. Vui lòng kiểm tra lại giá trên trang sản phẩm.
        </p>
      </form>
    </section>
  )
}
