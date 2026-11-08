import Image from 'next/image'
import loginBg from '../../../public/images/login-bg.jpg'

/**
 * Khung trang đăng nhập/đăng ký: ảnh trái cây phủ kín vùng giữa header và footer, thẻ
 * "kính mờ" đặt chính giữa.
 */
export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-var(--height-header-top)-var(--height-header-main))] items-center justify-center overflow-hidden px-4 py-12 md:py-16">
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
      </div>
    </section>
  )
}
