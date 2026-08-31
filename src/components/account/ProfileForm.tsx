'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/actions/auth'
import { FieldError, FormError, FormSuccess, SubmitButton } from '@/components/form/controls'
import type { FormState } from '@/lib/validation'

const initial: FormState = {}

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; phone: string; address: string }
}) {
  const [state, action] = useActionState(updateProfile, initial)

  return (
    <form action={action} className="space-y-3">
      {state.formError && <FormError>{state.formError}</FormError>}
      {state.success && <FormSuccess>Đã cập nhật thông tin tài khoản.</FormSuccess>}

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

      <SubmitButton label="Cập nhật" pendingLabel="Đang lưu..." />
    </form>
  )
}
