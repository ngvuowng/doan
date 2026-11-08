import type { Metadata } from 'next'
import { Fraunces, Montserrat } from 'next/font/google'
import { SITE, SITE_URL } from '@/lib/site'
import './globals.css'

// Montserrat cho chữ thường, Fraunces (serif, có trục opsz để chữ lớn thanh mảnh hơn) cho tiêu đề —
// cả hai là font biến thiên và đủ dấu tiếng Việt.
const montserrat = Montserrat({ subsets: ['latin', 'vietnamese'], variable: '--font-montserrat' })
const fraunces = Fraunces({ subsets: ['latin', 'vietnamese'], axes: ['opsz'], variable: '--font-fraunces' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} - ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
}

/**
 * Layout gốc chỉ dựng `<html>`/`<body>`, font và metadata. Header/footer nằm ở
 * `app/(site)/layout.tsx`; trang đăng nhập/đăng ký (`app/(auth)/`) hiện toàn màn hình.
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="vi"
      id="top"
      className={`${montserrat.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
