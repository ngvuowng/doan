import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Quản lý bài viết' }

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { publishedAt: 'desc' },
    include: { categories: { select: { name: true } } },
  })

  return (
    <>
      <h2 className="mb-4 font-heading text-lg font-bold uppercase">Bài viết ({posts.length})</h2>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-shell text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Bài viết</th>
              <th className="px-4 py-3 font-medium">Chuyên mục</th>
              <th className="px-4 py-3 font-medium">Ngày đăng</th>
              <th className="px-4 py-3 text-right font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {posts.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md border border-line">
                      <Image src={p.image} alt={p.title} fill sizes="64px" className="object-cover" />
                    </div>
                    <p className="font-medium">{p.title}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {p.categories.map((c) => c.name).join(', ') || '—'}
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(p.publishedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/tin-tuc/${p.slug}`}
                    className="rounded-md border border-line px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
                  >
                    Xem
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
