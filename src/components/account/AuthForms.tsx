'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { login, register, type AuthState } from '@/actions/auth'

const initial: AuthState = {}

export function LoginForm() {
  const [state, action] = useActionState(login, initial)

  return (
    <form action={action} className="space-y-3">
      {state.formError && <FormError>{state.formError}</FormError>}

      <div>
        <label className="label" htmlFor="login-email">
          Email *
        </label>
        <input id="login-email" name="email" type="email" className="field" required />
        {state.errors?.email && <FieldError>{state.errors.email}</FieldError>}
      </div>

      <div>
        <label className="label" htmlFor="login-password">
          Mật khẩu *
        </label>
        <input id="login-password" name="password" type="password" className="field" required />
        {state.errors?.password && <FieldError>{state.errors.password}</FieldError>}
      </div>

      <SubmitButton label="Đăng nhập" pendingLabel="Đang đăng nhập..." />

      <p className="text-sm text-muted">
        Chưa có tài khoản?{' '}
        <Link href="/tai-khoan/dang-ky" className="text-primary hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </form>
  )
}

export function RegisterForm() {
  const [state, action] = useActionState(register, initial)

  return (
    <form action={action} className="space-y-3">
      {state.formError && <FormError>{state.formError}</FormError>}

      <div>
        <label className="label" htmlFor="reg-name">
          Họ và tên *
        </label>
        <input id="reg-name" name="name" className="field" required />
        {state.errors?.name && <FieldError>{state.errors.name}</FieldError>}
      </div>

      <div>
        <label className="label" htmlFor="reg-email">
          Email *
        </label>
        <input id="reg-email" name="email" type="email" className="field" required />
        {state.errors?.email && <FieldError>{state.errors.email}</FieldError>}
      </div>

      <div>
        <label className="label" htmlFor="reg-password">
          Mật khẩu *
        </label>
        <input id="reg-password" name="password" type="password" className="field" required />
        {state.errors?.password && <FieldError>{state.errors.password}</FieldError>}
      </div>

      <div>
        <label className="label" htmlFor="reg-confirm">
          Nhập lại mật khẩu *
        </label>
        <input id="reg-confirm" name="confirmPassword" type="password" className="field" required />
        {state.errors?.confirmPassword && <FieldError>{state.errors.confirmPassword}</FieldError>}
      </div>

      <SubmitButton label="Đăng ký" pendingLabel="Đang tạo tài khoản..." />

      <p className="text-sm text-muted">
        Đã có tài khoản?{' '}
        <Link href="/tai-khoan/dang-nhap" className="text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  )
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? pendingLabel : label}
    </button>
  )
}

function FormError({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md bg-sale/10 px-3 py-2 text-sm text-sale">{children}</p>
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-sale">{children}</p>
}
