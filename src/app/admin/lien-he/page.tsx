import type { Metadata } from 'next'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { toggleContactHandled } from '@/actions/admin'

export const metadata: Metadata = { title: 'Tin nhắn liên hệ' }

export default async function AdminContactPage() {
  const messages = await api.admin.contacts()

  return (
    <>
      <h2 className="mb-4 font-heading text-lg font-bold uppercase">
        Tin nhắn liên hệ ({messages.length})
      </h2>

      {messages.length === 0 ? (
        <p className="rounded-lg border border-line py-16 text-center text-muted">
          Chưa có tin nhắn nào.
        </p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <article
              key={m.id}
              className={`rounded-lg border p-4 ${m.handled ? 'border-line bg-shell/50' : 'border-primary/40'}`}
            >
              <header className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {m.name}{' '}
                    <span className="text-sm font-normal text-muted">
                      &lt;{m.email}&gt;{m.phone ? ` — ${m.phone}` : ''}
                    </span>
                  </p>
                  <p className="text-xs text-muted">{formatDateTime(m.createdAt)}</p>
                </div>
                <form action={toggleContactHandled}>
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      m.handled
                        ? 'bg-primary/15 text-primary-dark hover:bg-primary/25'
                        : 'border border-line hover:border-primary hover:text-primary'
                    }`}
                  >
                    {m.handled ? '✓ Đã xử lý' : 'Đánh dấu đã xử lý'}
                  </button>
                </form>
              </header>
              {m.subject && <p className="mb-1 text-sm font-medium">{m.subject}</p>}
              <p className="whitespace-pre-line text-sm text-neutral-700">{m.message}</p>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
