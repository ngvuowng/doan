import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { getSidebarData } from '@/lib/blog'
import { formatDate } from '@/lib/format'
import { PageHeader } from '@/components/site/PageHeader'
import { PostCard } from '@/components/blog/PostCard'
import { PostSidebar } from '@/components/blog/PostSidebar'

export async function generateStaticParams() {
  const posts = await api.posts.list()
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<'/tin-tuc/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const post = await api.posts.get(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt.slice(0, 160),
    openGraph: { images: [post.image], type: 'article' },
  }
}

export default async function PostPage({ params }: PageProps<'/tin-tuc/[slug]'>) {
  const { slug } = await params
  const post = await api.posts.get(slug)
  if (!post) notFound()

  const [related, [categories, recent]] = await Promise.all([
    api.posts.list({ exclude: post.slug, limit: 3 }),
    getSidebarData(),
  ])

  return (
    <>
      <PageHeader
        title={post.title}
        crumbs={[{ label: 'Tin tức', href: '/tin-tuc' }, { label: post.title }]}
      />

      <div className="container-site flex flex-col gap-8 py-10 lg:flex-row">
        <article className="flex-1">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-muted">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            {post.categories.map((c) => (
              <Link
                key={c.id}
                href={`/chuyen-muc/${c.slug}`}
                className="rounded-full bg-shell px-2.5 py-0.5 text-xs hover:text-primary"
              >
                {c.name}
              </Link>
            ))}
          </div>

          <div className="relative mb-6 aspect-[3/2] overflow-hidden rounded-lg">
            <Image
              src={post.image}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
            />
          </div>

          {/* Nội dung HTML lấy nguyên từ RSS của site gốc. */}
          <div className="rich-text" dangerouslySetInnerHTML={{ __html: post.content }} />

          {related.length > 0 && (
            <section className="mt-12 border-t border-line pt-8">
              <h2 className="mb-6 font-heading text-xl font-bold uppercase">Bài viết liên quan</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                {related.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
            </section>
          )}
        </article>

        <PostSidebar categories={categories} recent={recent} />
      </div>
    </>
  )
}
