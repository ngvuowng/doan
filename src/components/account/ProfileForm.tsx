'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateProfile, type ProfileState } from '@/actions/auth'

const initial: ProfileState = {}

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; phone: string; address: string }
}) {
  const [state, action] = useActionState(updateProfile, initial)

  return (
    <form action={action} className="space-y-3">
      {state.formError && (
        <p className="rounded-md bg-sale/10 px-3 py-2 text-sm text-sale">{state.formError}</p>
      )}
      {state.success && (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary-dark">
          Đã cập nhật thông tin tài khoản.
        </p>
      )}

      <div>
        <label className="label" htmlFor="profile-name">
          Họ và tên *
        </label>
        <input id="profile-name" name="name" defaultValue={defaults.name} className="field" required />
        {state.errors?.name && <FieldError>{state.errors.name}</FieldError>}
      </div>

      <div>
        <label className="label" htmlFor="profile-phone">
          Số điện thoại
        </label>
        <input
          id="profile-phone"
          name="phone"
          inputMode="tel"
          defaultValue={defaults.phone}
          className="field"
        />
        {state.errors?.phone && <FieldError>{state.errors.phone}</FieldError>}
      </div>

      <div>
        <label className="label" htmlFor="profile-address">
          Địa chỉ nhận hàng
        </label>
        <input
          id="profile-address"
          name="address"
          defaultValue={defaults.address}
          className="field"
        />
        {state.errors?.address && <FieldError>{state.errors.address}</FieldError>}
      </div>

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? 'Đang lưu...' : 'Cập nhật'}
    </button>
  )
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-sale">{children}</p>
}
