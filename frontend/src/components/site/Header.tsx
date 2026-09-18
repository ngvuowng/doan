'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Fragment, useEffect, useState } from 'react'
import { SITE } from '@/lib/site'
import type { CategoryNode } from '@/lib/catalog'
import { useCart } from '@/components/cart/CartProvider'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { ChevronDownIcon, MenuIcon, SearchIcon, UserIcon, XIcon, CartIcon } from '@/components/site/icons'

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
  const { count, openCart } = useCart()
  const [stuck, setStuck] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  // Slug của mục menu đang xổ mega menu (null = đóng). Điều khiển bằng JS thay vì
  // `group-hover:` vì Tailwind v4 bọc biến thể đó trong `@media (hover: hover)` — trình
  // duyệt/thiết bị báo không có hover sẽ không bao giờ mở được; và để bấm/chạm cũng mở.
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // Bản gốc thu header từ 90px xuống 50px khi cuộn xuống.
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
            {isStaff && (
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

            {/* Mega menu: rê chuột hoặc bấm mũi tên để mở; chữ vẫn là link tới trang danh mục.
                Bảng luôn nằm trong DOM (chỉ ẩn/hiện bằng class) để crawler và e2e đọc được. */}
            {categories.map((group) => {
              const columns = megaColumns(group)
              const open = openMenu === group.slug
              return (
                <div
                  key={group.slug}
                  data-mega-menu
                  className="relative"
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
                      className="py-3 pl-3 pr-1 text-[13px] font-medium uppercase tracking-wide text-ink transition-colors hover:text-primary"
                    >
                      {group.name}
                    </Link>
                    {columns.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setOpenMenu(open ? null : group.slug)}
                        aria-expanded={open}
                        aria-label={`${open ? 'Đóng' : 'Mở'} menu ${group.name}`}
                        className="py-3 pl-1 pr-3 text-ink transition-colors hover:text-primary"
                      >
                        <ChevronDownIcon className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                  {columns.length > 0 && (
                    <div
                      className={`absolute left-0 top-full z-50 gap-8 whitespace-nowrap border border-line bg-white p-5 shadow-lg ${
                        open ? 'flex' : 'hidden'
                      }`}
                    >
                      {columns.map((col) => (
                        <div key={col.items[0].slug} className="min-w-[200px]">
                          <Link
                            href={`/danh-muc-san-pham/${col.heading.slug}`}
                            onClick={() => setOpenMenu(null)}
                            className="mb-2 block border-b border-line pb-2 text-[13px] font-semibold uppercase tracking-wide text-ink hover:text-primary"
                          >
                            {col.heading.name}
                          </Link>
                          {col.items.map((c) => (
                            <Link
                              key={c.slug}
                              href={`/danh-muc-san-pham/${c.slug}`}
                              onClick={() => setOpenMenu(null)}
                              className="block py-1.5 text-sm text-ink transition-colors hover:text-primary"
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
      className={`block py-2.5 pr-4 text-sm hover:bg-shell hover:text-primary ${
        MOBILE_INDENT[Math.min(depth, MOBILE_INDENT.length - 1)]
      } ${depth === 0 ? 'font-medium text-ink' : 'text-muted'}`}
    >
      {children}
    </Link>
  )
}
