'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login, register } from '@/actions/auth'
import { SubmitButton } from '@/components/form/controls'
import { LockIcon, MailIcon, UserIcon } from '@/components/site/icons'
import type { FormState } from '@/lib/validation'

const initial: FormState = {}

// Hai form nằm trên thẻ kính mờ của `AuthShell` (nền tối, chữ trắng), nên lỗi dùng đỏ nhạt
// thay cho màu `sale` của `FieldError`/`FormError` vốn chỉ rõ trên nền sáng.
const submitClass = 'btn w-full bg-white py-3 font-semibold text-ink hover:bg-cream'
const switchLinkClass = 'font-semibold text-white hover:underline'

function GlassFormError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-md border border-red-200/50 bg-red-600/30 px-3 py-2 text-sm text-white"
    >
      {children}
    </p>
  )
}

function GlassField({
  id,
  name,
  label,
  type = 'text',
  icon,
  error,
  autoComplete,
}: {
  id: string
  name: string
  label: string
  type?: string
  icon: React.ReactNode
  error?: string
  autoComplete?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-white/90">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="field-glass"
        />
        <span className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-white/90">
          {icon}
        </span>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-200">
          {error}
        </p>
      )}
    </div>
  )
}

export function LoginForm() {
  const [state, action] = useActionState(login, initial)

  return (
    <form action={action} className="space-y-6">
      {state.formError && <GlassFormError>{state.formError}</GlassFormError>}

      <GlassField
        id="login-email"
        name="email"
        type="email"
        label="E-mail"
        autoComplete="email"
        icon={<MailIcon className="size-4" />}
        error={state.errors?.email}
      />

      <GlassField
        id="login-password"
        name="password"
        type="password"
        label="Mật khẩu"
        autoComplete="current-password"
        icon={<LockIcon className="size-4" />}
        error={state.errors?.password}
      />

      <div className="flex items-center justify-between gap-3 text-sm text-white/90">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="size-4 cursor-pointer accent-primary"
          />
          Nhớ tôi
        </label>
        {/* Chưa có luồng đặt lại mật khẩu tự động — khách liên hệ cửa hàng để được hỗ trợ. */}
        <Link href="/lien-he" className="hover:text-white hover:underline">
          Quên mật khẩu?
        </Link>
      </div>

      <SubmitButton className={submitClass} label="Đăng nhập" pendingLabel="Đang đăng nhập..." />

      <p className="text-center text-sm text-white/85">
        Chưa có tài khoản?{' '}
        <Link href="/tai-khoan/dang-ky" className={switchLinkClass}>
          Đăng ký
        </Link>
      </p>
    </form>
  )
}

export function RegisterForm() {
  const [state, action] = useActionState(register, initial)

  return (
    <form action={action} className="space-y-6">
      {state.formError && <GlassFormError>{state.formError}</GlassFormError>}

      <GlassField
        id="reg-name"
        name="name"
        label="Họ và tên"
        autoComplete="name"
        icon={<UserIcon className="size-4" />}
        error={state.errors?.name}
      />

      <GlassField
        id="reg-email"
        name="email"
        type="email"
        label="E-mail"
        autoComplete="email"
        icon={<MailIcon className="size-4" />}
        error={state.errors?.email}
      />

      <GlassField
        id="reg-password"
        name="password"
        type="password"
        label="Mật khẩu"
        autoComplete="new-password"
        icon={<LockIcon className="size-4" />}
        error={state.errors?.password}
      />

      <GlassField
        id="reg-confirm"
        name="confirmPassword"
        type="password"
        label="Nhập lại mật khẩu"
        autoComplete="new-password"
        icon={<LockIcon className="size-4" />}
        error={state.errors?.confirmPassword}
      />

      <SubmitButton className={submitClass} label="Đăng ký" pendingLabel="Đang tạo tài khoản..." />

      <p className="text-center text-sm text-white/85">
        Đã có tài khoản?{' '}
        <Link href="/tai-khoan/dang-nhap" className={switchLinkClass}>
          Đăng nhập
        </Link>
      </p>
    </form>
  )
}
