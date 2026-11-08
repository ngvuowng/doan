import { CartProvider } from '@/components/cart/CartProvider'
import { SiteHeader } from '@/components/site/SiteHeader'
import { Footer } from '@/components/site/Footer'
import { ChatWidget } from '@/components/chat/ChatWidget'

/**
 * Khung chung của site: header, footer, giỏ hàng và trợ lý ảo. Dùng ở `app/(site)/layout.tsx`
 * và ở `app/not-found.tsx` (trang 404 gốc render ngoài nhóm `(site)` nên phải tự bọc).
 * Trang đăng nhập/đăng ký ở nhóm `(auth)` cố ý không dùng khung này.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </CartProvider>
  )
}
