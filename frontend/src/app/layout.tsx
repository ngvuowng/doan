import type { Metadata } from 'next'
import { Be_Vietnam_Pro, Lora } from 'next/font/google'
import { SITE, SITE_URL } from '@/lib/site'
import { CartProvider } from '@/components/cart/CartProvider'
import { SiteHeader } from '@/components/site/SiteHeader'
import { Footer } from '@/components/site/Footer'
import { ChatWidget } from '@/components/chat/ChatWidget'
import './globals.css'

// Be Vietnam Pro cho chữ thường, Lora (serif, có nghiêng) cho tiêu đề — cả hai đủ dấu tiếng Việt.
const beVietnam = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'], variable: '--font-be-vietnam' })
const lora = Lora({ subsets: ['latin', 'vietnamese'], style: ['normal', 'italic'], variable: '--font-lora' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} - ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="vi"
      id="top"
      className={`${beVietnam.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatWidget />
        </CartProvider>
      </body>
    </html>
  )
}
