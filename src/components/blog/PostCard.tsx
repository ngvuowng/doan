import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/lib/format'

export type PostCardData = {
  slug: string
  title: string
  excerpt: string
  image: string
  publishedAt: string
}

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-line">
      <Link href={`/tin-tuc/${post.slug}`} className="relative block aspect-[3/2] overflow-hidden">
        <Image
          src={post.image}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <time dateTime={post.publishedAt} className="text-xs text-muted">
          {formatDate(post.publishedAt)}
        </time>
        <h2 className="mt-1.5 font-heading text-base leading-snug">
          <Link href={`/tin-tuc/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-3 text-sm text-muted">{post.excerpt}</p>
        <Link
          href={`/tin-tuc/${post.slug}`}
          className="mt-3 self-start text-sm text-primary hover:underline"
        >
          Đọc tiếp →
        </Link>
      </div>
    </article>
  )
}
