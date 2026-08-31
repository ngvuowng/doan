'use client'

import './globals.css'

/**
 * Bắt lỗi xảy ra ngay trong root layout — `error.tsx` không làm được việc này vì
 * nó nằm *bên trong* layout. Từ khi tách backend riêng, header và footer đều gọi
 * API nên backend chết là cả layout hỏng, phải có lớp chặn ở đây.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="vi">
      <body>
        <div className="container-site flex min-h-screen flex-col items-center justify-center py-20 text-center">
          <h1 className="font-heading text-2xl font-bold uppercase">Không tải được trang</h1>
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
