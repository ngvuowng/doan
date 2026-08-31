import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { api } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { formatPrice } from '@/lib/format'
import { ProfileForm } from '@/components/account/ProfileForm'

export const metadata: Metadata = { title: 'Tài khoản' }

export default async function AccountPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/tai-khoan/dang-nhap')

  const [user, orders] = await Promise.all([api.auth.me(), api.orders.mine()])

  // Đơn đã huỷ không tính vào tổng chi tiêu.
  const spent = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 font-heading text-lg font-bold uppercase">
          Xin chào, {user.name}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Email" value={user.email} />
          <Stat label="Số đơn hàng" value={String(orders.length)} />
          <Stat label="Tổng chi tiêu" value={formatPrice(spent)} />
        </div>
        <Link href="/tai-khoan/don-hang" className="btn-outline mt-4">
          Xem đơn hàng của tôi
        </Link>
      </section>

      <section className="rounded-lg border border-line p-5">
        <h2 className="mb-4 font-heading text-lg font-bold uppercase">Thông tin tài khoản</h2>
        <ProfileForm
          defaults={{
            name: user.name,
            phone: user.phone ?? '',
            address: user.address ?? '',
          }}
        />
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-medium break-words">{value}</p>
    </div>
  )
}
