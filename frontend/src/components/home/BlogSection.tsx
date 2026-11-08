import Image from 'next/image'
import Link from 'next/link'
import { SITE } from '@/lib/site'
import { formatDate } from '@/lib/format'
import { SectionHeading } from '@/components/home/SectionHeading'

export type BlogCardData = {
  slug: string
  title: string
  excerpt: string
  image: string
  publishedAt: string
}

/**
 * Khối "Có thể bạn cần" ở trang chủ: 4 bài viết mới nhất, card kiểu mẫu Bean (nhãn ngày vàng
 * đè lên ảnh, "Đăng bởi", link đọc tiếp gạch chân chuyển vàng khi rê chuột).
 */
export function BlogSection({ posts }: { posts: BlogCardData[] }) {
  if (posts.length === 0) return null

  return (
    <section className="bg-shell py-14 md:py-20">
      <div className="container-site">
        <SectionHeading eyebrow="Góc trái cây" title="Có thể bạn cần" className="mb-8 md:mb-12" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((post) => (
            <article key={post.slug} className="group flex flex-col">
              <Link href={`/tin-tuc/${post.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-[14px]">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <time
                  dateTime={post.publishedAt}
                  className="absolute bottom-3 left-3 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-primary-dark"
                >
                  {formatDate(post.publishedAt)}
                </time>
              </Link>

              <div className="flex flex-1 flex-col pt-4">
                <p className="text-xs text-muted">
                  Đăng bởi: <span className="font-medium text-gold-ink">{SITE.name}</span>
                </p>
                <h3 className="mt-1.5 line-clamp-2 font-heading text-lg leading-snug font-medium">
                  <Link href={`/tin-tuc/${post.slug}`} className="transition-colors hover:text-gold-ink">
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{post.excerpt}</p>
                <Link
                  href={`/tin-tuc/${post.slug}`}
                  className="mt-auto self-start pt-4 text-xs font-semibold tracking-[0.12em] text-primary uppercase underline decoration-primary/40 underline-offset-[6px] transition-colors hover:text-gold-ink hover:decoration-accent"
                >
                  Đọc tiếp
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
