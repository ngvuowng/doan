import Image from 'next/image'
import Link from 'next/link'
import loginBg from '../../../public/images/login-bg.jpg'

/**
 * Khung trang đăng nhập/đăng ký: trang riêng toàn màn hình (nhóm `app/(auth)/`, không có
 * header/footer), ảnh trái cây phủ kín và thẻ "kính mờ" đặt chính giữa.
 */
export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="relative isolate flex min-h-svh flex-1 items-center justify-center overflow-hidden px-4 py-12">
      <Image
        src={loginBg}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="-z-20 object-cover"
      />
      {/* Phủ tối nhẹ để chữ trắng trên thẻ kính luôn đọc được, kể cả chỗ nền sáng. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/25" />

      <div className="w-full max-w-md rounded-2xl border border-white/50 bg-white/10 p-8 text-white shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
        <h1 className="mb-6 text-center font-sans text-3xl font-bold text-white">{title}</h1>
        {children}
        {/* Trang không có header nên cần một lối quay về. */}
        <p className="mt-6 text-center text-xs">
          <Link href="/" className="text-white/75 hover:text-white hover:underline">
            ← Về trang chủ
          </Link>
        </p>
      </div>
    </main>
  )
}
