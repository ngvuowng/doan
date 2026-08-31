import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { POST_CARD_SELECT, getSidebarData } from '@/lib/blog'
import { PageHeader } from '@/components/site/PageHeader'
import { PostCard } from '@/components/blog/PostCard'
import { PostSidebar } from '@/components/blog/PostSidebar'

export async function generateStaticParams() {
  const categories = await prisma.category.findMany({
    where: { kind: 'post' },
    select: { slug: true },
  })
  return categories.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/chuyen-muc/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const category = await prisma.category.findFirst({ where: { slug, kind: 'post' } })
  return category ? { title: category.name } : {}
}

export default async function PostCategoryPage({ params }: PageProps<'/chuyen-muc/[slug]'>) {
  const { slug } = await params
  const category = await prisma.category.findFirst({ where: { slug, kind: 'post' } })
  if (!category) notFound()

  const [posts, [categories, recent]] = await Promise.all([
    prisma.post.findMany({
      where: { categories: { some: { id: category.id } } },
      orderBy: { publishedAt: 'desc' },
      select: POST_CARD_SELECT,
    }),
    getSidebarData(),
  ])

  return (
    <>
      <PageHeader
        title={category.name}
        crumbs={[{ label: 'Tin tức', href: '/tin-tuc' }, { label: category.name }]}
      />
      <div className="container-site flex flex-col gap-8 py-10 lg:flex-row">
        <div className="flex-1">
          {posts.length === 0 ? (
            <p className="py-16 text-center text-muted">Chuyên mục này chưa có bài viết.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          )}
        </div>
        <PostSidebar categories={categories} recent={recent} activeSlug={category.slug} />
      </div>
    </>
  )
}
