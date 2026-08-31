import type { z } from 'zod'

/**
 * Hình dạng chung cho state của mọi server action gắn với form:
 * `errors` là lỗi theo từng ô nhập, `formError` là lỗi chung của cả form.
 */
export type FormState = {
  errors?: Record<string, string>
  formError?: string
  success?: boolean
}

/** Gom lỗi zod thành map theo tên trường, giữ lỗi đầu tiên của mỗi trường. */
export function collectIssues(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0])
    errors[key] ??= issue.message
  }
  return errors
}
