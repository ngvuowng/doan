'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Fragment, useEffect, useState } from 'react'
import { SITE } from '@/lib/site'
import type { CategoryNode } from '@/lib/catalog'
import { useCart } from '@/components/cart/CartProvider'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { ChevronDownIcon, MenuIcon, PhoneIcon, SearchIcon, UserIcon, XIcon, CartIcon } from '@/components/site/icons'

type Props = {
  /** Cây danh mục sản phẩm sâu tuỳ ý: mỗi gốc là một mục menu chính; gốc có con xổ mega menu
   *  (mỗi con có con là một cột, các con lá gom một cột). Cấp sâu hơn xem ở thanh bên. */
  categories: CategoryNode[]
  /** Tên người dùng đang đăng nhập, null nếu là khách. */
  userName: string | null
  /** Nhân viên (mọi vai trò trừ khách hàng) thấy link vào khu quản trị. */
  isStaff: boolean
}

export function Header({ categories, userName, isStaff }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { count, openCart } = useCart()
  const [stuck, setStuck] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  // Slug của mục menu đang xổ mega menu (null = đóng). Điều khiển bằng JS thay vì
  // `group-hover:` vì Tailwind v4 bọc biến thể đó trong `@media (hover: hover)` — trình
  // duyệt/thiết bị báo không có hover sẽ không bao giờ mở được; và để bấm/chạm cũng mở.
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // Header thu thấp lại khi cuộn xuống.
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 120)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Esc hoặc bấm ra ngoài thanh menu thì đóng mega menu.
  useEffect(() => {
    if (openMenu === null) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenMenu(null)
    const onPointerDown = (e: PointerEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest('[data-mega-menu]')) setOpenMenu(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [openMenu])

  // Esc đóng ô tìm kiếm thả xuống.
  useEffect(() => {
    if (!searchOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSearchOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [searchOpen])

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
    setSearchOpen(false)
    router.push(`/tim-kiem?q=${encodeURIComponent(q)}`)
  }

  const navLinks = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Giới thiệu', href: '/gioi-thieu' },
  ]
  const tailLinks = [
    { label: 'Tin tức', href: '/chuyen-muc/tin-tuc' },
    { label: 'Liên hệ', href: '/lien-he' },
  ]

  return (
    <>
      {/* Thanh trên cùng: nền xanh đen, viền dưới vàng mờ. Không nằm trong <header> để e2e đọc
          đúng thanh menu chính (`header nav`). */}
      <div className="hidden border-b border-accent/25 bg-primary text-white md:block print:hidden">
        <div className="container-site flex h-10 items-center justify-between gap-6 text-[13px]">
          <span className="truncate text-white/80">
            Chào mừng bạn đến với <span className="font-semibold text-primary-light">{SITE.name}</span> —{' '}
            {SITE.tagline.toLowerCase()}
          </span>
          <nav className="flex shrink-0 items-center gap-5">
            <Link href="/tai-khoan" className="transition-colors hover:text-accent">
              {userName ? `Chào, ${userName}` : 'Tài khoản'}
            </Link>
            <Link href="/thanh-toan" className="transition-colors hover:text-accent">
              Thanh toán
            </Link>
            <Link href="/cua-hang" className="transition-colors hover:text-accent">
              Cửa hàng
            </Link>
            {isStaff && (
              <Link
                href="/admin"
                className="rounded-full border border-accent/60 px-3 py-0.5 text-primary-light transition-colors hover:bg-accent hover:text-primary-dark"
              >
                Quản trị
              </Link>
            )}
          </nav>
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur transition-shadow duration-300 print:hidden ${
          stuck ? 'shadow-[0_12px_32px_-20px_rgb(16_43_42/0.45)]' : ''
        }`}
      >
        {/* Một hàng kiểu mẫu Bean: logo | menu giữa | tìm kiếm, tài khoản, giỏ, nút "Mua ngay".
            Mobile: nút menu | logo giữa | giỏ hàng. */}
        <div
          className={`container-site relative flex items-center gap-2 transition-[height] duration-300 ${
            stuck ? 'h-16' : 'h-[68px] lg:h-[84px]'
          }`}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="-ml-1 p-2 text-primary lg:hidden"
            aria-label="Mở menu"
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          <Link
            href="/"
            className="absolute left-1/2 flex shrink-0 -translate-x-1/2 items-center lg:static lg:translate-x-0"
            aria-label={SITE.name}
          >
            <Image
              src="/images/logo.png"
              alt={SITE.name}
              width={951}
              height={406}
              preload
              className={`w-auto transition-[height] duration-300 ${stuck ? 'h-10' : 'h-11 lg:h-14'}`}
            />
          </Link>

          {/* Thanh menu chính: cao bằng cả hàng để mega menu thả xuống ngay mép dưới header. */}
          <nav className="hidden flex-1 self-stretch lg:block">
            <div className="flex h-full items-center justify-center gap-1 xl:gap-2">
              {navLinks.map((l) => (
                <HeaderLink key={l.href} href={l.href} current={isCurrent(pathname, l.href)}>
                  {l.label}
                </HeaderLink>
              ))}

              {/* Mega menu: rê chuột hoặc bấm mũi tên để mở; chữ vẫn là link tới trang danh mục.
                  Bảng luôn nằm trong DOM (chỉ ẩn/hiện bằng class) để crawler và e2e đọc được. */}
              {categories.map((group) => {
                const columns = megaColumns(group)
                const open = openMenu === group.slug
                return (
                  <div
                    key={group.slug}
                    data-mega-menu
                    className="relative flex h-full items-center"
                    onMouseEnter={() => columns.length > 0 && setOpenMenu(group.slug)}
                    onMouseLeave={() => setOpenMenu(null)}
                    onBlur={(e) => {
                      // Tab ra khỏi cả khối (link + bảng) thì đóng; chuyển tiêu điểm bên trong thì giữ.
                      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpenMenu(null)
                    }}
                  >
                    <div className="flex items-center">
                      <Link
                        href={`/danh-muc-san-pham/${group.slug}`}
                        onClick={() => setOpenMenu(null)}
                        aria-current={isCurrent(pathname, `/danh-muc-san-pham/${group.slug}`) ? 'page' : undefined}
                        className={`${NAV_LINK} pl-3 pr-1 after:left-3 after:right-1`}
                      >
                        {group.name}
                      </Link>
                      {columns.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setOpenMenu(open ? null : group.slug)}
                          aria-expanded={open}
                          aria-label={`${open ? 'Đóng' : 'Mở'} menu ${group.name}`}
                          className="py-3 pl-1 pr-3 text-ink transition-colors hover:text-gold-ink"
                        >
                          <ChevronDownIcon className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                    {/* Menu nằm giữa thanh nên bảng canh giữa theo mục cha, tránh tràn mép phải. */}
                    {columns.length > 0 && (
                      <div
                        className={`absolute left-1/2 top-full z-50 -translate-x-1/2 gap-8 whitespace-nowrap rounded-b-xl border border-t-2 border-line border-t-accent bg-white p-6 shadow-[0_24px_48px_-24px_rgb(16_43_42/0.35)] ${
                          open ? 'flex' : 'hidden'
                        }`}
                      >
                        {columns.map((col) => (
                          <div key={col.items[0].slug} className="min-w-[200px]">
                            <Link
                              href={`/danh-muc-san-pham/${col.heading.slug}`}
                              onClick={() => setOpenMenu(null)}
                              className="mb-2 block border-b border-line pb-2 font-heading text-base font-medium text-gold-ink hover:text-primary"
                            >
                              {col.heading.name}
                            </Link>
                            {col.items.map((c) => (
                              <Link
                                key={c.slug}
                                href={`/danh-muc-san-pham/${c.slug}`}
                                onClick={() => setOpenMenu(null)}
                                className="block py-1.5 text-sm text-ink transition-colors hover:translate-x-0.5 hover:text-gold-ink"
                              >
                                {c.name}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {tailLinks.map((l) => (
                <HeaderLink key={l.href} href={l.href} current={isCurrent(pathname, l.href)}>
                  {l.label}
                </HeaderLink>
              ))}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-expanded={searchOpen}
              aria-label={searchOpen ? 'Đóng tìm kiếm' : 'Tìm kiếm'}
              className="hidden p-2 text-primary transition-colors hover:text-gold-ink md:block"
            >
              {searchOpen ? <XIcon className="h-5 w-5" /> : <SearchIcon className="h-5 w-5" />}
            </button>
            <Link
              href="/tai-khoan"
              className="hidden p-2 text-primary transition-colors hover:text-gold-ink md:block"
              aria-label="Tài khoản"
            >
              <UserIcon className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="relative p-2 text-primary transition-colors hover:text-gold-ink"
              aria-label={`Giỏ hàng, ${count} sản phẩm`}
            >
              <CartIcon className="h-6 w-6" />
              {count > 0 && (
                <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-primary-dark">
                  {count}
                </span>
              )}
            </button>
            <Link href="/cua-hang" className="btn-accent ml-3 hidden xl:inline-flex">
              Mua ngay
            </Link>
          </div>
        </div>

        {/* Ô tìm kiếm thả xuống dưới header (desktop/tablet). Mobile tìm trong ngăn menu. */}
        {searchOpen && (
          <div className="absolute inset-x-0 top-full hidden border-b border-line bg-cream shadow-[0_18px_32px_-24px_rgb(16_43_42/0.45)] md:block">
            <form onSubmit={submitSearch} className="container-site flex py-4">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Bạn muốn tìm loại trái cây nào?"
                aria-label="Tìm kiếm sản phẩm"
                autoFocus
                className="h-12 w-full rounded-l-full border border-r-0 border-line bg-white pl-5 pr-3 text-sm focus:border-accent focus:outline-none"
              />
              <button type="submit" className="btn-primary h-12 shrink-0 rounded-l-none px-7">
                <SearchIcon className="h-4 w-4" />
                Tìm kiếm
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-primary-dark/60"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          />
          <div className="absolute left-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-cream">
            <div className="flex items-center justify-between bg-accent px-4 py-3 text-primary-dark">
              <span className="font-heading text-lg font-medium">Danh mục</span>
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
                className="h-10 w-full rounded-l-full border border-r-0 border-line bg-white px-4 text-sm focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                className="grid h-10 w-11 shrink-0 place-items-center rounded-r-full bg-primary text-white"
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
              <MobileCategoryLinks nodes={categories} depth={0} onClick={() => setMobileOpen(false)} />
              {tailLinks.map((l) => (
                <MobileLink key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>
                  {l.label}
                </MobileLink>
              ))}
              <div className="mt-2 border-t border-line pt-2">
                <MobileLink href="/tai-khoan" onClick={() => setMobileOpen(false)}>
                  {userName ? `Chào, ${userName}` : 'Tài khoản'}
                </MobileLink>
                {isStaff && (
                  <MobileLink href="/admin" onClick={() => setMobileOpen(false)}>
                    Trang quản trị
                  </MobileLink>
                )}
              </div>
            </div>

            <a
              href={`tel:${SITE.phone.replace(/\./g, '')}`}
              className="flex items-center gap-3 border-t border-line bg-primary px-4 py-3.5 text-sm text-white"
            >
              <PhoneIcon className="h-4 w-4 text-accent" />
              Hotline: <span className="font-semibold text-primary-light">{SITE.phone}</span>
            </a>
          </div>
        </div>
      )}

      <CartDrawer />
    </>
  )
}

type MenuColumn = { heading: CategoryNode; items: CategoryNode[] }

/**
 * Chia con của một mục menu thành cột: con có con → một cột riêng (tiêu đề = chính nó);
 * các con lá đứng liền nhau gom vào một cột lấy tiêu đề là mục menu (link tới trang của nó).
 */
function megaColumns(group: CategoryNode): MenuColumn[] {
  const columns: MenuColumn[] = []
  let leafColumn: MenuColumn | null = null
  for (const child of group.children) {
    if (child.children.length > 0) {
      columns.push({ heading: child, items: child.children })
      leafColumn = null
    } else {
      if (!leafColumn) columns.push((leafColumn = { heading: group, items: [] }))
      leafColumn.items.push(child)
    }
  }
  return columns
}

/** Trang chủ chỉ khớp đúng "/"; các mục khác khớp cả trang con (vd. /chuyen-muc/tin-tuc/...). */
function isCurrent(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

// Gạch chân vàng chạy từ trái khi rê chuột và cố định ở trang đang mở.
const NAV_LINK =
  'relative py-3 text-[14px] font-medium text-ink transition-colors hover:text-gold-ink aria-[current=page]:text-gold-ink ' +
  'after:absolute after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-accent ' +
  'after:transition-transform hover:after:scale-x-100 aria-[current=page]:after:scale-x-100'

function HeaderLink({ href, current, children }: { href: string; current: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={current ? 'page' : undefined} className={`${NAV_LINK} px-3 after:inset-x-3`}>
      {children}
    </Link>
  )
}

/** Danh mục trong menu mobile, đệ quy mọi độ sâu; mỗi cấp thụt thêm 1rem. */
function MobileCategoryLinks({
  nodes,
  depth,
  onClick,
}: {
  nodes: CategoryNode[]
  depth: number
  onClick: () => void
}) {
  return nodes.map((node) => (
    <Fragment key={node.slug}>
      <MobileLink href={`/danh-muc-san-pham/${node.slug}`} onClick={onClick} depth={depth}>
        {node.name}
      </MobileLink>
      <MobileCategoryLinks nodes={node.children} depth={depth + 1} onClick={onClick} />
    </Fragment>
  ))
}

// Tailwind cần tên lớp viết đủ (không ghép chuỗi), nên tra bảng theo độ sâu và kẹp ở mức cuối.
const MOBILE_INDENT = ['pl-4', 'pl-8', 'pl-12', 'pl-16']

function MobileLink({
  href,
  children,
  onClick,
  depth = 0,
}: {
  href: string
  children: React.ReactNode
  onClick: () => void
  depth?: number
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block py-2.5 pr-4 text-sm hover:bg-shell hover:text-gold-ink ${
        MOBILE_INDENT[Math.min(depth, MOBILE_INDENT.length - 1)]
      } ${depth === 0 ? 'font-medium text-ink' : 'text-muted'}`}
    >
      {children}
    </Link>
  )
}
