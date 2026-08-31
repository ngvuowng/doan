'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitContact, type ContactState } from '@/actions/contact'

const initial: ContactState = {}

export function ContactForm() {
  const [state, action] = useActionState(submitContact, initial)

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="contact-name">
            Họ và tên *
          </label>
          <input id="contact-name" name="name" className="field" required />
          {state.errors?.name && <FieldError>{state.errors.name}</FieldError>}
        </div>
        <div>
          <label className="label" htmlFor="contact-phone">
            Số điện thoại
          </label>
          <input id="contact-phone" name="phone" inputMode="tel" className="field" />
          {state.errors?.phone && <FieldError>{state.errors.phone}</FieldError>}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="contact-email">
          Email *
        </label>
        <input id="contact-email" name="email" type="email" className="field" required />
        {state.errors?.email && <FieldError>{state.errors.email}</FieldError>}
      </div>

      <div>
        <label className="label" htmlFor="contact-subject">
          Tiêu đề
        </label>
        <input id="contact-subject" name="subject" className="field" />
      </div>

      <div>
        <label className="label" htmlFor="contact-message">
          Nội dung *
        </label>
        <textarea id="contact-message" name="message" rows={4} className="field" required />
        {state.errors?.message && <FieldError>{state.errors.message}</FieldError>}
      </div>

      {state.formError && (
        <p className="rounded-md bg-sale/10 px-3 py-2 text-sm text-sale">{state.formError}</p>
      )}

      {state.success && (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary-dark">
          Cảm ơn bạn! Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.
        </p>
      )}

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
      {pending ? 'Đang gửi...' : 'Gửi liên hệ'}
    </button>
  )
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-sale">{children}</p>
}
