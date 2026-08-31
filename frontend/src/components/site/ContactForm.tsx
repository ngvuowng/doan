'use client'

import { useActionState } from 'react'
import { submitContact } from '@/actions/contact'
import { FieldError, FormError, FormSuccess, SubmitButton } from '@/components/form/controls'
import type { FormState } from '@/lib/validation'

const initial: FormState = {}

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

      {state.formError && <FormError>{state.formError}</FormError>}

      {state.success && (
        <FormSuccess>Cảm ơn bạn! Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.</FormSuccess>
      )}

      <SubmitButton
        className="btn-primary w-full sm:w-auto"
        label="Gửi liên hệ"
        pendingLabel="Đang gửi..."
      />
    </form>
  )
}
