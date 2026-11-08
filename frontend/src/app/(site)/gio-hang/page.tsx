import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/PageHeader'
import { CartPageContent } from '@/components/cart/CartPageContent'

export const metadata: Metadata = { title: 'Giỏ hàng' }

export default function CartPage() {
  return (
    <>
      <PageHeader title="Giỏ hàng" crumbs={[{ label: 'Giỏ hàng' }]} />
      <div className="container-site py-10">
        <CartPageContent />
      </div>
    </>
  )
}
