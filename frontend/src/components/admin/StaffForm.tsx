'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { saveStaff } from '@/actions/staff'
import { FieldError, FormError, SubmitButton } from '@/components/form/controls'
import { PERMISSIONS, STAFF_ROLES, type Permission } from '@/lib/permissions'
import type { FormState } from '@/lib/validation'

const initial: FormState = {}

export type StaffFormValues = {
  id: string | null
  name: string
  email: string
  phone: string
  role: string
  storeId: string
  permissions: string[]
}

type StoreOption = { id: string; name: string }

type Props = {
  staff: StaffFormValues
  stores: StoreOption[]
}

export function StaffForm({ staff, stores }: Props) {
  // saveStaff nhận staffId qua bind để phân biệt thêm mới và cập nhật.
  const [state, action] = useActionState(saveStaff.bind(null, staff.id), initial)
  // Vai trò và các ô quyền phải controlled: đổi vai trò thì tick lại theo bộ mặc định.
  const [role, setRole] = useState(staff.role)
  const [permissions, setPermissions] = useState<readonly string[]>(staff.permissions)
  const isAdmin = role === 'ADMIN'

  function changeRole(value: string) {
    setRole(value)
    setPermissions(STAFF_ROLES.find((r) => r.value === value)?.defaults ?? [])
  }

  function togglePermission(key: Permission, checked: boolean) {
    setPermissions((current) =>
      checked ? [...current, key] : current.filter((p) => p !== key),
    )
  }

  return (
    <form action={action} className="space-y-4">
      {state.formError && <FormError>{state.formError}</FormError>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Họ tên *" error={state.errors?.name}>
          <input name="name" defaultValue={staff.name} className="field" required />
        </Field>
        <Field label="Email *" error={state.errors?.email}>
          {/* Email là tên đăng nhập nên không cho đổi sau khi tạo. */}
          <input
            name="email"
            type="email"
            defaultValue={staff.email}
            className="field"
            required
            readOnly={staff.id !== null}
          />
        </Field>
        <Field label="Số điện thoại" error={state.errors?.phone}>
          <input name="phone" defaultValue={staff.phone} className="field" />
        </Field>
        {staff.id === null && (
          <Field label="Mật khẩu *" error={state.errors?.password}>
            <input name="password" type="password" className="field" required minLength={6} />
          </Field>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vai trò *" error={state.errors?.role}>
          <select
            name="role"
            value={role}
            onChange={(e) => changeRole(e.target.value)}
            className="field"
          >
            {STAFF_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        {/* ADMIN không thuộc cửa hàng nào; ô `disabled` không được gửi lên. */}
        <Field label="Cửa hàng *" error={state.errors?.storeId}>
          <select
            name="storeId"
            defaultValue={staff.storeId}
            className="field"
            disabled={isAdmin}
            required={!isAdmin}
          >
            <option value="">— Chọn cửa hàng —</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="label">Quyền hạn</legend>
        {isAdmin ? (
          <p className="text-sm text-muted">Quản trị viên có toàn quyền, kể cả quản lý nhân sự.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {PERMISSIONS.map((p) => (
              <label key={p.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="permissions"
                  value={p.key}
                  checked={permissions.includes(p.key)}
                  onChange={(e) => togglePermission(p.key, e.target.checked)}
                  className="accent-primary"
                />
                {p.label}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex gap-3 border-t border-line pt-4">
        <SubmitButton
          label={staff.id ? 'Cập nhật nhân viên' : 'Tạo tài khoản'}
          pendingLabel="Đang lưu..."
        />
        <Link href="/admin/nhan-su" className="btn-outline">
          Huỷ
        </Link>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
