import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { PageHeader } from '@/components/site/PageHeader'
import { CheckoutForm } from '@/components/cart/CheckoutForm'

export const metadata: Metadata = { title: 'Thanh toán' }

export default async function CheckoutPage() {
  const session = await getCurrentUser()
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.id },
        select: { name: true, email: true, phone: true, address: true },
      })
    : null

  return (
    <>
      <PageHeader title="Thanh toán" crumbs={[{ label: 'Thanh toán' }]} />
      <div className="container-site py-10">
        <CheckoutForm
          defaults={
            user
              ? {
                  name: user.name,
                  email: user.email,
                  phone: user.phone ?? '',
                  address: user.address ?? '',
                }
              : null
          }
        />
      </div>
    </>
  )
}
