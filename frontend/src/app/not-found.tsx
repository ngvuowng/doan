import Link from 'next/link'
import { PageHeader } from '@/components/site/PageHeader'

export default function NotFound() {
  return (
    <>
      <PageHeader title="Không tìm thấy trang" crumbs={[{ label: 'Lỗi 404' }]} />
      <div className="container-site py-20 text-center">
        <p className="font-heading text-6xl font-bold text-primary">404</p>
        <h2 className="mt-3 font-heading text-xl font-bold uppercase">
          Rất tiếc, trang bạn tìm không tồn tại
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Đường dẫn có thể đã thay đổi hoặc sản phẩm không còn được bán. Bạn thử quay lại trang chủ
          hoặc xem toàn bộ sản phẩm nhé.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            Về trang chủ
          </Link>
          <Link href="/cua-hang" className="btn-outline">
            Xem cửa hàng
          </Link>
        </div>
      </div>
    </>
  )
}
