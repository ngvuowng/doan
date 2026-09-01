'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { ChatIcon, XIcon } from '@/components/site/icons'

const STORAGE_KEY = 'halona-chat'

/**
 * UUID nhận diện phiên chat của trình duyệt này, sinh một lần rồi giữ mãi — vai trò
 * giống `halona-cart` của giỏ hàng. Backend dùng nó để tìm lại đúng cuộc trò chuyện,
 * kể cả khi khách chưa đăng nhập.
 */
function readClientKey(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && saved.length >= 8) return saved
    // `crypto.randomUUID` chỉ có trong secure context (https hoặc localhost).
    const key =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`
    window.localStorage.setItem(STORAGE_KEY, key)
    return key
  } catch {
    // Chế độ riêng tư chặn localStorage: vẫn chat được, chỉ là mất lịch sử khi tải lại.
    return `tam-${Math.random().toString(36).slice(2, 16)}`
  }
}

/** Nút nổi mở trợ lý tư vấn, hiện ở mọi trang phía khách hàng. */
export function ChatWidget() {
  const pathname = usePathname()
  const [clientKey, setClientKey] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const launcherRef = useRef<HTMLButtonElement>(null)

  // Đọc sau khi mount: máy chủ không truy cập được localStorage nên lần render đầu
  // buộc phải chưa có khoá, đọc trong effect mới tránh được lệch hydration.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- đồng bộ với localStorage sau hydration */
    setClientKey(readClientKey())
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    launcherRef.current?.focus()
  }, [])

  // Khu quản trị không cần trợ lý bán hàng, ẩn cho gọn màn hình.
  if (pathname.startsWith('/admin')) return null

  return (
    <>
      {isOpen && clientKey && <ChatPanel clientKey={clientKey} onClose={close} />}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Đóng trợ lý tư vấn' : 'Mở trợ lý tư vấn Halona'}
        aria-expanded={isOpen}
        aria-controls="halona-chat-panel"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary-dark sm:bottom-6 sm:right-6"
      >
        {isOpen ? <XIcon className="h-6 w-6" /> : <ChatIcon className="h-7 w-7" />}
      </button>
    </>
  )
}
