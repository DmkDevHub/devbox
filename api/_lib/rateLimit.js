import { createHmac } from 'node:crypto'
import { sendError } from './response.js'

const WINDOW_SECONDS = 60
const LIMITS = { GET: 60, POST: 5, PUT: 10, DELETE: 5 }

export function getClientAddress(req) {
  const address = req.headers?.['x-vercel-forwarded-for']
    ?? req.headers?.['x-forwarded-for']
    ?? req.headers?.['x-real-ip']
  if (typeof address !== 'string') return null
  const firstAddress = address.split(',')[0].trim()
  return firstAddress && firstAddress.length <= 128 ? firstAddress : null
}

export function createRateLimiter({ getSql, secret = process.env.RATE_LIMIT_SECRET, now = () => Date.now() }) {
  return async function checkRateLimit(req) {
    const address = getClientAddress(req)
    if (!address || typeof secret !== 'string' || secret.length < 32) {
      throw new Error('Rate limit configuration is unavailable')
    }

    const method = req.method
    const limit = LIMITS[method]
    if (!limit) return { allowed: true }

    const clientKey = createHmac('sha256', secret).update(address).digest('hex')
    const sql = getSql()
    const rows = await sql`
      WITH cleanup AS (
        DELETE FROM rate_limit_windows
        WHERE window_start < date_trunc('minute', now()) - interval '1 day'
      )
      INSERT INTO rate_limit_windows (scope, client_key, window_start, request_count)
      VALUES (${method}, ${clientKey}, date_trunc('minute', now()), 1)
      ON CONFLICT (scope, client_key, window_start)
      DO UPDATE SET request_count = rate_limit_windows.request_count + 1
      WHERE rate_limit_windows.request_count < ${limit}
      RETURNING request_count, window_start
    `

    if (rows.length) return { allowed: true }

    const current = await sql`
      SELECT window_start
      FROM rate_limit_windows
      WHERE scope = ${method} AND client_key = ${clientKey}
        AND window_start = date_trunc('minute', now())
      LIMIT 1
    `
    const windowStart = current[0] ? new Date(current[0].window_start).getTime() : now()
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((windowStart + WINDOW_SECONDS * 1000 - now()) / 1000)),
    }
  }
}

export async function enforceRateLimit(req, res, checkRateLimit) {
  try {
    const result = await checkRateLimit(req)
    if (result.allowed) return true
    sendError(res, 429, 'RATE_LIMIT_EXCEEDED', '요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해 주세요.', {
      'Retry-After': String(result.retryAfter),
    })
  } catch {
    sendError(res, 503, 'RATE_LIMIT_UNAVAILABLE', '요청 보호 기능을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.')
  }
  return false
}
