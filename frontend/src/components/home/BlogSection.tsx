import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/lib/format'

export type BlogCardData = {
  slug: string
  title: string
  excerpt: string
  image: string
  publishedAt: string
}

/** Khối "CÓ THỂ BẠN CẦN" ở trang chủ: 4 bài viết mới nhất. */
export function BlogSection({ posts }: { posts: BlogCardData[] }) {
  if (posts.length === 0) return null

  return (
    <section className="bg-shell py-12">
      <div className="container-site">
        <h2 className="section-title mb-8">“Có thể bạn cần”</h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((post) => (
            <article key={post.slug} className="group flex flex-col overflow-hidden rounded-md bg-white">
              <Link href={`/tin-tuc/${post.slug}`} className="relative block aspect-[3/2] overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>

              <div className="flex flex-1 flex-col p-4">
                <time dateTime={post.publishedAt} className="text-xs text-muted">
                  {formatDate(post.publishedAt)}
                </time>
                <h3 className="mt-1.5 font-heading text-base leading-snug">
                  <Link href={`/tin-tuc/${post.slug}`} className="hover:text-primary">
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{post.excerpt}</p>
                <Link
                  href={`/tin-tuc/${post.slug}`}
                  className="mt-3 self-start text-sm text-primary hover:underline"
                >
                  Đọc tiếp →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
