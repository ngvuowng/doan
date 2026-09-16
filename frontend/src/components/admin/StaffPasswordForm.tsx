'use client'

import { useActionState } from 'react'
import { resetStaffPassword } from '@/actions/staff'
import { FieldError, FormError, FormSuccess, SubmitButton } from '@/components/form/controls'
import type { FormState } from '@/lib/validation'

const initial: FormState = {}

/** Admin đặt mật khẩu mới cho nhân viên quên mật khẩu (chưa có luồng quên mật khẩu qua email). */
export function StaffPasswordForm({ staffId }: { staffId: string }) {
  const [state, action] = useActionState(resetStaffPassword.bind(null, staffId), initial)

  return (
    <form action={action} className="space-y-4">
      {state.formError && <FormError>{state.formError}</FormError>}
      {state.success && <FormSuccess>Đã đặt lại mật khẩu.</FormSuccess>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="staff-password" className="label">
            Mật khẩu mới *
          </label>
          <input
            id="staff-password"
            name="password"
            type="password"
            className="field"
            required
            minLength={6}
          />
          {state.errors?.password && <FieldError>{state.errors.password}</FieldError>}
        </div>
        <div>
          <label htmlFor="staff-confirm-password" className="label">
            Nhập lại mật khẩu *
          </label>
          <input
            id="staff-confirm-password"
            name="confirmPassword"
            type="password"
            className="field"
            required
          />
          {state.errors?.confirmPassword && (
            <FieldError>{state.errors.confirmPassword}</FieldError>
          )}
        </div>
      </div>

      <SubmitButton label="Đặt lại mật khẩu" pendingLabel="Đang lưu..." className="btn-outline" />
    </form>
  )
}
