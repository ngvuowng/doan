'use client'

import Link from 'next/link'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-site py-20 text-center">
      <h2 className="font-heading text-2xl font-bold uppercase">Đã có lỗi xảy ra</h2>
      <p className="mx-auto mt-2 max-w-md text-muted">
        Hệ thống gặp sự cố khi tải nội dung này. Bạn vui lòng thử lại.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Thử lại
        </button>
        <Link href="/" className="btn-outline">
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
