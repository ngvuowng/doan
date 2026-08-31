import type { Metadata } from 'next'
import { Pattaya, Roboto, Roboto_Condensed } from 'next/font/google'
import { SITE, SITE_URL } from '@/lib/site'
import { CartProvider } from '@/components/cart/CartProvider'
import { SiteHeader } from '@/components/site/SiteHeader'
import { Footer } from '@/components/site/Footer'
import './globals.css'

// Đúng 3 font mà site gốc nạp từ Google Fonts.
const roboto = Roboto({ subsets: ['latin', 'vietnamese'], weight: ['400', '500', '700'], variable: '--font-roboto' })
const robotoCondensed = Roboto_Condensed({ subsets: ['latin', 'vietnamese'], weight: ['400', '700'], variable: '--font-roboto-condensed' })
const pattaya = Pattaya({ subsets: ['latin', 'vietnamese'], weight: '400', variable: '--font-pattaya' })

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
      className={`${roboto.variable} ${robotoCondensed.variable} ${pattaya.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
