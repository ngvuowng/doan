'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SITE } from '@/lib/site'
import { useCart } from '@/components/cart/CartProvider'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { ChevronDownIcon, MenuIcon, SearchIcon, UserIcon, XIcon, CartIcon } from '@/components/site/icons'

export type NavCategory = { slug: string; name: string }

type Props = {
  /** Danh mục sản phẩm cho dropdown "Cửa hàng #Halona". */
  categories: NavCategory[]
  /** Tên người dùng đang đăng nhập, null nếu là khách. */
  userName: string | null
  isAdmin: boolean
}

export function Header({ categories, userName, isAdmin }: Props) {
  const router = useRouter()
  const { count, openCart } = useCart()
  const [stuck, setStuck] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [query, setQuery] = useState('')

  // Bản gốc thu header từ 90px xuống 50px khi cuộn xuống.
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 120)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setMobileOpen(false)
    router.push(`/tim-kiem?q=${encodeURIComponent(q)}`)
  }

  const navLinks = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Giới thiệu', href: '/gioi-thieu' },
  ]
  const tailLinks = [
    { label: 'Làm đẹp', href: '/chuyen-muc/lam-dep' },
    { label: 'Tin tức', href: '/chuyen-muc/tin-tuc' },
    { label: 'Liên hệ', href: '/lien-he' },
  ]

  return (
    <>
      {/* Thanh trên cùng: 35px, nền xanh primary */}
      <div className="hidden bg-primary text-white md:block">
        <div className="container-site flex h-[35px] items-center justify-between text-[13px]">
          <span>{SITE.tagline}</span>
          <nav className="flex items-center gap-5">
            <Link href="/tai-khoan" className="hover:underline">
              {userName ? `Chào, ${userName}` : 'Tài khoản'}
            </Link>
            <Link href="/thanh-toan" className="hover:underline">
              Thanh toán
            </Link>
            <Link href="/cua-hang" className="hover:underline">
              Cửa hàng
            </Link>
            {isAdmin && (
              <Link href="/admin" className="rounded-full bg-white/20 px-3 py-0.5 hover:bg-white/30">
                Quản trị
              </Link>
            )}
          </nav>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 shadow-[2px_2px_15px_#00000033] backdrop-blur">
        {/* Hàng chính: logo + tìm kiếm + giỏ hàng */}
        <div
          className={`container-site flex items-center gap-4 transition-[height] duration-300 ${
            stuck ? 'h-[50px]' : 'h-[70px] md:h-[90px]'
          }`}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="-ml-1 p-2 lg:hidden"
            aria-label="Mở menu"
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          <Link href="/" className="flex shrink-0 items-center" aria-label={SITE.name}>
            <Image
              src="/images/logo.png"
              alt={SITE.name}
              width={951}
              height={406}
              priority
              className={`w-auto transition-[height] duration-300 ${stuck ? 'h-8' : 'h-10 md:h-14'}`}
            />
          </Link>

          <form onSubmit={submitSearch} className="ml-auto hidden max-w-md flex-1 md:flex">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              aria-label="Tìm kiếm sản phẩm"
              className="h-10 w-full rounded-l-md border border-r-0 border-line px-3.5 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-r-md bg-primary text-white hover:bg-primary-dark"
              aria-label="Tìm kiếm"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link
              href="/tai-khoan"
              className="hidden p-2 text-ink hover:text-primary md:block"
              aria-label="Tài khoản"
            >
              <UserIcon className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="relative p-2 text-ink hover:text-primary"
              aria-label={`Giỏ hàng, ${count} sản phẩm`}
            >
              <CartIcon className="h-6 w-6" />
              {count > 0 && (
                <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Thanh menu chính */}
        <nav className="hidden border-t border-line bg-shell lg:block">
          <div className="container-site flex items-center gap-1">
            {navLinks.map((l) => (
              <HeaderLink key={l.href} href={l.href}>
                {l.label}
              </HeaderLink>
            ))}

            <div
              className="relative"
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <Link
                href="/cua-hang"
                className="flex items-center gap-1 px-3 py-3 text-[13px] font-medium uppercase tracking-wide text-ink transition-colors hover:text-primary"
              >
                Cửa hàng #Halona
                <ChevronDownIcon className="h-3 w-3" />
              </Link>
              {shopOpen && (
                <div className="absolute left-0 top-full z-50 min-w-[240px] border border-line bg-white py-2 shadow-lg">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/danh-muc-san-pham/${c.slug}`}
                      className="block px-4 py-2 text-sm text-ink transition-colors hover:bg-shell hover:text-primary"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {tailLinks.map((l) => (
              <HeaderLink key={l.href} href={l.href}>
                {l.label}
              </HeaderLink>
            ))}
          </div>
        </nav>
      </header>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          />
          <div className="absolute left-0 top-0 flex h-full w-[80%] max-w-xs flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-heading font-bold uppercase">Danh mục</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Đóng menu">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitSearch} className="flex border-b border-line p-3">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                aria-label="Tìm kiếm sản phẩm"
                className="h-10 w-full rounded-l-md border border-r-0 border-line px-3 text-sm focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-r-md bg-primary text-white"
                aria-label="Tìm kiếm"
              >
                <SearchIcon className="h-4 w-4" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto py-2">
              {navLinks.map((l) => (
                <MobileLink key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>
                  {l.label}
                </MobileLink>
              ))}
              <MobileLink href="/cua-hang" onClick={() => setMobileOpen(false)}>
                Cửa hàng #Halona
              </MobileLink>
              {categories.map((c) => (
                <MobileLink
                  key={c.slug}
                  href={`/danh-muc-san-pham/${c.slug}`}
                  onClick={() => setMobileOpen(false)}
                  nested
                >
                  {c.name}
                </MobileLink>
              ))}
              {tailLinks.map((l) => (
                <MobileLink key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>
                  {l.label}
                </MobileLink>
              ))}
              <div className="mt-2 border-t border-line pt-2">
                <MobileLink href="/tai-khoan" onClick={() => setMobileOpen(false)}>
                  {userName ? `Chào, ${userName}` : 'Tài khoản'}
                </MobileLink>
                {isAdmin && (
                  <MobileLink href="/admin" onClick={() => setMobileOpen(false)}>
                    Trang quản trị
                  </MobileLink>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <CartDrawer />
    </>
  )
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-3 text-[13px] font-medium uppercase tracking-wide text-ink transition-colors hover:text-primary"
    >
      {children}
    </Link>
  )
}

function MobileLink({
  href,
  children,
  onClick,
  nested,
}: {
  href: string
  children: React.ReactNode
  onClick: () => void
  nested?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block py-2.5 text-sm text-ink hover:bg-shell hover:text-primary ${
        nested ? 'pl-8 pr-4 text-muted' : 'px-4 font-medium'
      }`}
    >
      {children}
    </Link>
  )
}
