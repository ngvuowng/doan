import Link from 'next/link'

type Props = {
  page: number
  totalPages: number
  /** Đường dẫn cơ sở, vd. "/cua-hang". */
  basePath: string
  /** Các tham số query cần giữ lại khi chuyển trang. */
  params?: Record<string, string | undefined>
}

export function Pagination({ page, totalPages, basePath, params = {} }: Props) {
  if (totalPages <= 1) return null

  const href = (p: number) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v)
    if (p > 1) qs.set('trang', String(p))
    const s = qs.toString()
    return s ? `${basePath}?${s}` : basePath
  }

  return (
    <nav aria-label="Phân trang" className="mt-10 flex justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} className="rounded-md border border-line px-3 py-1.5 text-sm hover:border-primary hover:text-primary">
          ← Trước
        </Link>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`rounded-md border px-3.5 py-1.5 text-sm ${
            p === page
              ? 'border-primary bg-primary text-white'
              : 'border-line hover:border-primary hover:text-primary'
          }`}
        >
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link href={href(page + 1)} className="rounded-md border border-line px-3 py-1.5 text-sm hover:border-primary hover:text-primary">
          Sau →
        </Link>
      )}
    </nav>
  )
}
