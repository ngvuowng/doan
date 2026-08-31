import type { Metadata } from 'next'
import { api } from '@/lib/api'
import { getSidebarData } from '@/lib/blog'
import { PageHeader } from '@/components/site/PageHeader'
import { PostCard } from '@/components/blog/PostCard'
import { PostSidebar } from '@/components/blog/PostSidebar'

export const metadata: Metadata = {
  title: 'Tin tức',
  description: 'Kiến thức về nông sản sạch, dinh dưỡng và làm đẹp từ Halona Fruits.',
}

export default async function BlogPage() {
  const [posts, [categories, recent]] = await Promise.all([
    api.posts.list(),
    getSidebarData(),
  ])

  return (
    <>
      <PageHeader title="Tin tức" crumbs={[{ label: 'Tin tức' }]} />
      <div className="container-site flex flex-col gap-8 py-10 lg:flex-row">
        <div className="flex-1">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </div>
        <PostSidebar categories={categories} recent={recent} />
      </div>
    </>
  )
}
