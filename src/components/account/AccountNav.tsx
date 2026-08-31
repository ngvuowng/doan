'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/auth'

const LINKS = [
  { href: '/tai-khoan', label: 'Tổng quan' },
  { href: '/tai-khoan/don-hang', label: 'Đơn hàng của tôi' },
]

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="lg:w-56 lg:shrink-0">
      <ul className="space-y-1 text-sm">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={`block rounded-md px-3 py-2 transition-colors ${
                pathname === l.href ? 'bg-primary text-white' : 'hover:bg-shell hover:text-primary'
              }`}
            >
              {l.label}
            </Link>
          </li>
        ))}
        {isAdmin && (
          <li>
            <Link
              href="/admin"
              className="block rounded-md px-3 py-2 transition-colors hover:bg-shell hover:text-primary"
            >
              Trang quản trị
            </Link>
          </li>
        )}
        <li>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-shell hover:text-sale"
            >
              Đăng xuất
            </button>
          </form>
        </li>
      </ul>
    </nav>
  )
}
