import { describe, expect, it } from 'vitest'
import { createRateLimiter, enforceRateLimit, getClientAddress } from '../api/_lib/rateLimit.js'

function response() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) { this.headers[name] = value },
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
}

describe('shared API rate limit', () => {
  it('uses the platform supplied client IP and not a raw forwarded chain', () => {
    expect(getClientAddress({ headers: {
      'x-vercel-forwarded-for': '203.0.113.9',
      'x-forwarded-for': '198.51.100.4, 203.0.113.9',
    } })).toBe('203.0.113.9')
    expect(getClientAddress({ headers: { 'x-forwarded-for': ' 198.51.100.4, 203.0.113.9 ' } })).toBe('198.51.100.4')
    expect(getClientAddress({ headers: {} })).toBeNull()
  })

  it('atomically increments a shared method/IP minute bucket with a keyed IP hash', async () => {
    let sqlCalls = 0
    let boundValues
    const limiter = createRateLimiter({
      secret: 'a'.repeat(32),
      now: () => Date.parse('2026-10-21T00:00:30Z'),
      getSql: () => async (parts, ...values) => {
        sqlCalls += 1
        boundValues = values
        expect(parts.join('')).toContain('ON CONFLICT')
        expect(parts.join('')).toContain('request_count <')
        return sqlCalls === 1 ? [{ request_count: 1 }] : []
      },
    })
    const result = await limiter({ method: 'POST', headers: { 'x-vercel-forwarded-for': '203.0.113.9' } })
    expect(result).toEqual({ allowed: true })
    expect(boundValues).toContain('POST')
    expect(boundValues).toContain(5)
    expect(boundValues).not.toContain('203.0.113.9')
  })

  it.each([['GET', 60], ['POST', 5], ['PUT', 10], ['DELETE', 5]])(
    'uses the configured per-method threshold for %s (%i/min)', async (method, limit) => {
      let boundValues
      const limiter = createRateLimiter({
        secret: 'd'.repeat(32),
        getSql: () => async (_parts, ...values) => { boundValues = values; return [{ request_count: 1 }] },
      })
      await limiter({ method, headers: { 'x-vercel-forwarded-for': '203.0.113.13' } })
      expect(boundValues).toContain(method)
      expect(boundValues).toContain(limit)
    })

  it('returns 429 and Retry-After when the minute bucket is full', async () => {
    let sqlCalls = 0
    const limiter = createRateLimiter({
      secret: 'b'.repeat(32),
      now: () => Date.parse('2026-10-21T00:00:40Z'),
      getSql: () => async () => {
        sqlCalls += 1
        return sqlCalls === 1 ? [] : [{ window_start: '2026-10-21T00:00:00Z' }]
      },
    })
    const res = response()
    expect(await enforceRateLimit({ method: 'DELETE', headers: { 'x-vercel-forwarded-for': '203.0.113.10' } }, res, limiter)).toBe(false)
    expect(res.statusCode).toBe(429)
    expect(res.headers['Retry-After']).toBe('20')
    expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
  })

  it('fails closed when shared storage or its secret is unavailable', async () => {
    const failingLimiter = createRateLimiter({
      secret: 'c'.repeat(32), getSql: () => async () => { throw new Error('db secret') },
    })
    const res = response()
    expect(await enforceRateLimit({ method: 'GET', headers: { 'x-vercel-forwarded-for': '203.0.113.11' } }, res, failingLimiter)).toBe(false)
    expect(res.statusCode).toBe(503)
    expect(JSON.stringify(res.body)).not.toContain('db secret')

    const missingSecret = createRateLimiter({ secret: '', getSql: () => { throw new Error('must not connect') } })
    await expect(missingSecret({ method: 'GET', headers: { 'x-vercel-forwarded-for': '203.0.113.12' } }))
      .rejects.toThrow('Rate limit configuration is unavailable')
  })
})
