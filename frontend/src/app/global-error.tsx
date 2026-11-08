'use client'

import './globals.css'

/**
 * Lớp chặn cuối cho lỗi xảy ra ngay trong root layout — `error.tsx` không làm được việc
 * này vì nó nằm *bên trong* layout. Header/footer (gọi API) nay ở `app/(site)/layout.tsx`
 * nên backend chết sẽ do `app/error.tsx` bắt; file này chỉ còn phòng hờ.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="vi">
      <body>
        <div className="container-site flex min-h-screen flex-col items-center justify-center py-20 text-center">
          <h1 className="font-heading text-2xl font-bold">Không tải được trang</h1>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Máy chủ dữ liệu đang không phản hồi. Bạn vui lòng thử lại sau ít phút.
          </p>
          <button type="button" onClick={reset} className="btn-primary mt-6">
            Thử lại
          </button>
        </div>
      </body>
    </html>
  )
}
