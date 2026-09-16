'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/auth'

type NavLink = { href: string; label: string }

/** Danh sách mục do layout tính theo quyền của người đang đăng nhập. */
export function AdminNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname()

  return (
    <nav className="lg:w-56 lg:shrink-0">
      <ul className="flex gap-1 overflow-x-auto text-sm lg:flex-col lg:overflow-visible">
        {links.map((l) => {
          const active = l.href === '/admin' ? pathname === l.href : pathname.startsWith(l.href)
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`block whitespace-nowrap rounded-md px-3 py-2 transition-colors ${
                  active ? 'bg-primary text-white' : 'hover:bg-shell hover:text-primary'
                }`}
              >
                {l.label}
              </Link>
            </li>
          )
        })}
        <li className="lg:mt-4 lg:border-t lg:border-line lg:pt-4">
          <Link
            href="/"
            className="block whitespace-nowrap rounded-md px-3 py-2 transition-colors hover:bg-shell hover:text-primary"
          >
            ← Về trang chủ
          </Link>
        </li>
        <li>
          <form action={logout}>
            <button
              type="submit"
              className="w-full whitespace-nowrap rounded-md px-3 py-2 text-left transition-colors hover:bg-shell hover:text-sale"
            >
              Đăng xuất
            </button>
          </form>
        </li>
      </ul>
    </nav>
  )
}
