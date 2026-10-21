import { z } from 'zod'

const optionalText = (max) => z.string().trim().max(max).optional().nullable()
  .transform((value) => value || null)

export const bookmarkSchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: z.string().trim().min(1).max(2048).url().refine((value) => {
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol)
    } catch {
      return false
    }
  }),
  category: optionalText(50),
  description: optionalText(500),
}).strict()

export const bookmarkIdSchema = z.string().refine((value) => (
  /^[1-9]\d{0,18}$/.test(value)
  && BigInt(value) <= 9223372036854775807n
))

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(Number.MAX_SAFE_INTEGER).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(200).default(''),
  category: z.string().trim().max(50).default(''),
}).strict()

export const MAX_REQUEST_BYTES = 16 * 1024

export function parseBookmarkBody(req) {
  const length = req.headers?.['content-length']
  if (length !== undefined && (!/^\d+$/.test(String(length)) || Number(length) > MAX_REQUEST_BYTES)) {
    return { tooLarge: true }
  }

  let body = req.body
  if (typeof body === 'string' || Buffer.isBuffer(body)) {
    try {
      body = JSON.parse(body.toString())
    } catch {
      return { error: true }
    }
  }

  if (body === undefined || body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { error: true }
  }

  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_REQUEST_BYTES) {
    return { tooLarge: true }
  }

  const result = bookmarkSchema.safeParse(body)
  return result.success ? { data: result.data } : { error: true }
}
