'use client'

import { useFormStatus } from 'react-dom'

/** Nút gửi form. Luôn tự khoá khi đang gửi để không tạo bản ghi trùng. */
export function SubmitButton({
  label,
  pendingLabel,
  className = 'btn-primary',
}: {
  label: string
  pendingLabel: string
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  )
}

/** Lỗi chung của cả form (thường là lỗi trả về từ API). */
export function FormError({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const base = 'rounded-md bg-sale/10 px-3 py-2 text-sm text-sale'
  return <p className={className ? `${base} ${className}` : base}>{children}</p>
}

/** Thông báo thành công sau khi gửi form. */
export function FormSuccess({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary-dark">{children}</p>
  )
}

/** Lỗi của một ô nhập, đặt ngay dưới ô đó. */
export function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-sale">{children}</p>
}
