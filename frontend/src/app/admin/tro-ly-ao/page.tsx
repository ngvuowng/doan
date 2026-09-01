import type { Metadata } from 'next'
import Link from 'next/link'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'

export const metadata: Metadata = { title: 'Hội thoại trợ lý ảo' }

export default async function AdminChatPage({ searchParams }: PageProps<'/admin/tro-ly-ao'>) {
  const { id } = await searchParams
  const sessions = await api.admin.chats()
  const selected = typeof id === 'string' ? await api.admin.chat(id) : null

  return (
    <>
      <h2 className="mb-4 font-heading text-lg font-bold uppercase">
        Hội thoại trợ lý ảo ({sessions.length})
      </h2>

      {sessions.length === 0 ? (
        <p className="rounded-lg border border-line py-16 text-center text-muted">
          Chưa có cuộc trò chuyện nào.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/tro-ly-ao?id=${s.id}`}
                  className={`block rounded-lg border p-3 transition-colors ${
                    selected?.id === s.id
                      ? 'border-primary bg-primary/5'
                      : 'border-line hover:border-primary'
                  }`}
                >
                  <p className="truncate text-sm font-medium">{s.title ?? '(chưa có tiêu đề)'}</p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {s.userName ? `${s.userName} <${s.userEmail}>` : 'Khách vãng lai'}
                  </p>
                  <p className="text-xs text-muted">
                    {s.messageCount} tin · {formatDateTime(s.updatedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {selected ? (
            <article className="space-y-3 rounded-lg border border-line p-4">
              <header className="border-b border-line pb-3">
                <p className="font-medium">
                  {selected.userName ? (
                    <>
                      {selected.userName}{' '}
                      <span className="text-sm font-normal text-muted">
                        &lt;{selected.userEmail}&gt;
                      </span>
                    </>
                  ) : (
                    'Khách vãng lai'
                  )}
                </p>
                <p className="text-xs text-muted">
                  Bắt đầu {formatDateTime(selected.createdAt)} · {selected.messageCount} tin nhắn
                </p>
              </header>

              {selected.messages.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'text-right' : ''}>
                  <p
                    className={`inline-block max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-left text-sm ${
                      m.role === 'user' ? 'bg-primary text-white' : 'bg-shell text-ink'
                    }`}
                  >
                    {m.content}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">{formatDateTime(m.createdAt)}</p>
                </div>
              ))}
            </article>
          ) : (
            <p className="rounded-lg border border-line py-16 text-center text-muted">
              Chọn một cuộc trò chuyện để xem nội dung.
            </p>
          )}
        </div>
      )}
    </>
  )
}
