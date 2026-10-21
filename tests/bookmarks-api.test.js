import { describe, expect, it } from 'vitest'
import { createBookmarkItemHandler, createBookmarksCollectionHandler } from '../api/_lib/bookmarks.js'

const now = '2026-10-21T00:00:00.000Z'
const allowRateLimit = async () => ({ allowed: true })

function createMemorySql(initialRows = []) {
  const rows = initialRows.map((row) => ({ ...row }))
  let nextId = rows.length + 1
  const calls = []

  const sql = async (parts, ...values) => {
    const statement = parts.join('?').replace(/\s+/g, ' ').trim().toUpperCase()
    calls.push({ statement, values })

    if (statement.startsWith('INSERT INTO BOOKMARKS')) {
      const [title, url, category, description] = values
      const row = { id: String(nextId++), title, url, category, description, created_at: now, updated_at: now }
      rows.push(row)
      return [{ ...row }]
    }

    if (statement.startsWith('UPDATE BOOKMARKS')) {
      const [title, url, category, description, id] = values
      const row = rows.find((item) => item.id === id)
      if (!row) return []
      Object.assign(row, { title, url, category, description, updated_at: now })
      return [{ ...row }]
    }

    if (statement.startsWith('DELETE FROM BOOKMARKS')) {
      const [id] = values
      const index = rows.findIndex((item) => item.id === id)
      return index === -1 ? [] : rows.splice(index, 1).map((row) => ({ id: row.id }))
    }

    if (statement.startsWith('SELECT COUNT(*)')) {
      const [search, , category] = values
      const filtered = rows.filter((row) => row.title.toLowerCase().includes(search.toLowerCase())
        && (!category || row.category === category))
      return [{ total: String(filtered.length) }]
    }

    if (statement.startsWith('SELECT ID::TEXT AS ID')) {
      if (statement.includes('WHERE ID = ?::BIGINT')) {
        const [id] = values
        const row = rows.find((item) => item.id === id)
        return row ? [{ ...row }] : []
      }

      const [search, , category, , limit, offset] = values
      return rows
        .filter((row) => row.title.toLowerCase().includes(search.toLowerCase())
          && (!category || row.category === category))
        .sort((left, right) => right.created_at.localeCompare(left.created_at) || Number(right.id) - Number(left.id))
        .slice(offset, offset + limit)
        .map((row) => ({ ...row }))
    }

    throw new Error(`Unexpected SQL in test double: ${statement}`)
  }

  return { sql, calls, rows }
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    ended: false,
    setHeader(name, value) { this.headers[name] = value; return this },
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
    end() { this.ended = true; return this },
  }
}

async function invoke(handler, request) {
  const response = createResponse()
  await handler({ headers: {}, query: {}, ...request }, response)
  return response
}

const validBody = {
  title: 'Vue 문서 🙂',
  url: 'https://vuejs.org',
  category: 'Frontend',
  description: '공식 문서',
}

describe('bookmark collection API', () => {
  it('returns paginated rows with string IDs and ISO dates', async () => {
    const memory = createMemorySql([
      { id: '9007199254740993', ...validBody, created_at: now, updated_at: now },
    ])
    const handler = createBookmarksCollectionHandler({ getSql: () => memory.sql, checkRateLimit: allowRateLimit })
    const response = await invoke(handler, { method: 'GET', query: {} })

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      data: [{ id: '9007199254740993', ...validBody, createdAt: now, updatedAt: now }],
      pagination: { page: 1, limit: 20, total: 1 },
    })
  })

  it('binds search input and applies category filtering', async () => {
    const memory = createMemorySql([
      { id: '1', ...validBody, created_at: now, updated_at: now },
    ])
    const handler = createBookmarksCollectionHandler({ getSql: () => memory.sql, checkRateLimit: allowRateLimit })
    const search = "%' OR 1=1 --"
    const response = await invoke(handler, {
      method: 'GET',
      query: { page: '1', limit: '5', search, category: 'Backend' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.body.data).toEqual([])
    expect(memory.calls[0].values).toContain(search)
    expect(memory.calls[0].statement).toContain('ILIKE')
    expect(response.body.pagination).toEqual({ page: 1, limit: 5, total: 0 })
  })

  it('validates query limits and rejects unsupported query fields', async () => {
    const handler = createBookmarksCollectionHandler({ getSql: () => createMemorySql().sql, checkRateLimit: allowRateLimit })
    for (const query of [{ page: '0' }, { limit: '51' }, { unknown: 'x' }]) {
      const response = await invoke(handler, { method: 'GET', query })
      expect(response.statusCode).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('rejects writes while the public write switch is off', async () => {
    let databaseCalled = false
    const handler = createBookmarksCollectionHandler({
      getSql: () => { databaseCalled = true; return createMemorySql().sql },
      writesEnabled: () => false,
      checkRateLimit: allowRateLimit,
    })
    const response = await invoke(handler, { method: 'POST', body: validBody })

    expect(response.statusCode).toBe(503)
    expect(response.body.error.code).toBe('WRITES_DISABLED')
    expect(databaseCalled).toBe(false)
  })

  it('blocks requests when the shared rate limiter is full or unavailable', async () => {
    let databaseCalled = false
    const makeHandler = (checkRateLimit) => createBookmarksCollectionHandler({
      getSql: () => { databaseCalled = true; return createMemorySql().sql },
      checkRateLimit,
    })
    const limited = await invoke(makeHandler(async () => ({ allowed: false, retryAfter: 30 })), {
      method: 'GET', query: {},
    })
    expect(limited.statusCode).toBe(429)
    expect(limited.headers['Retry-After']).toBe('30')
    expect(databaseCalled).toBe(false)

    const unavailable = await invoke(makeHandler(async () => { throw new Error('private database detail') }), {
      method: 'GET', query: {},
    })
    expect(unavailable.statusCode).toBe(503)
    expect(unavailable.body.error.code).toBe('RATE_LIMIT_UNAVAILABLE')
    expect(JSON.stringify(unavailable.body)).not.toContain('private database detail')
    expect(databaseCalled).toBe(false)
  })

  it('rejects invalid URLs, unknown fields and oversized request bodies', async () => {
    const handler = createBookmarksCollectionHandler({
      getSql: () => createMemorySql().sql,
      writesEnabled: () => true,
      checkRateLimit: allowRateLimit,
    })

    const invalidUrl = await invoke(handler, { method: 'POST', body: { ...validBody, url: 'javascript:alert(1)' } })
    const extraField = await invoke(handler, { method: 'POST', body: { ...validBody, admin: true } })
    const tooLarge = await invoke(handler, {
      method: 'POST',
      headers: { 'content-length': '16385' },
      body: validBody,
    })

    expect(invalidUrl.statusCode).toBe(400)
    expect(extraField.statusCode).toBe(400)
    expect(tooLarge.statusCode).toBe(413)
  })

  it('enforces required title and field length limits', async () => {
    const handler = createBookmarksCollectionHandler({
      getSql: () => createMemorySql().sql,
      writesEnabled: () => true,
      checkRateLimit: allowRateLimit,
    })
    const cases = [
      { ...validBody, title: '   ' },
      { ...validBody, title: 'x'.repeat(201) },
      { ...validBody, url: 'https://example.com/' + 'x'.repeat(2040) },
      { ...validBody, category: 'x'.repeat(51) },
      { ...validBody, description: 'x'.repeat(501) },
    ]

    for (const body of cases) {
      const response = await invoke(handler, { method: 'POST', body })
      expect(response.statusCode).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('creates a bookmark and normalizes optional empty values', async () => {
    const memory = createMemorySql()
    const handler = createBookmarksCollectionHandler({ getSql: () => memory.sql, writesEnabled: () => true, checkRateLimit: allowRateLimit })
    const response = await invoke(handler, {
      method: 'POST',
      body: { title: validBody.title, url: validBody.url, category: '  ', description: '' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.body.data).toMatchObject({ title: validBody.title, category: null, description: null })
  })

  it('reports unsupported methods and hides database error details', async () => {
    const methodHandler = createBookmarksCollectionHandler()
    const methodResponse = await invoke(methodHandler, { method: 'PATCH' })
    expect(methodResponse.statusCode).toBe(405)
    expect(methodResponse.headers.Allow).toBe('GET, POST')

    const failingHandler = createBookmarksCollectionHandler({
      getSql: () => async () => { throw new Error('postgres://secret-password/internal') },
      checkRateLimit: allowRateLimit,
    })
    const errorResponse = await invoke(failingHandler, { method: 'GET', query: {} })
    expect(errorResponse.statusCode).toBe(503)
    expect(JSON.stringify(errorResponse.body)).not.toContain('secret-password')
  })
})

describe('bookmark item API', () => {
  it('supports get, update and delete for one ID', async () => {
    const memory = createMemorySql([
      { id: '1', ...validBody, created_at: now, updated_at: now },
    ])
    const handler = createBookmarkItemHandler({ getSql: () => memory.sql, writesEnabled: () => true, checkRateLimit: allowRateLimit })

    const detail = await invoke(handler, { method: 'GET', query: { id: '1' } })
    const updated = await invoke(handler, {
      method: 'PUT', query: { id: '1' }, body: { ...validBody, title: '수정된 제목' },
    })
    const deleted = await invoke(handler, { method: 'DELETE', query: { id: '1' } })

    expect(detail.statusCode).toBe(200)
    expect(detail.body.data.id).toBe('1')
    expect(updated.statusCode).toBe(200)
    expect(updated.body.data.title).toBe('수정된 제목')
    expect(deleted.statusCode).toBe(204)
    expect(deleted.ended).toBe(true)
    expect(memory.rows).toHaveLength(0)
  })

  it('validates IDs and returns 404 for missing records', async () => {
    const handler = createBookmarkItemHandler({
      getSql: () => createMemorySql().sql,
      writesEnabled: () => true,
      checkRateLimit: allowRateLimit,
    })
    const invalidId = await invoke(handler, { method: 'GET', query: { id: '1 OR 1=1' } })
    const missing = await invoke(handler, { method: 'GET', query: { id: '99' } })
    const maxOverflow = await invoke(handler, { method: 'GET', query: { id: '9223372036854775808' } })

    expect(invalidId.statusCode).toBe(400)
    expect(missing.statusCode).toBe(404)
    expect(maxOverflow.statusCode).toBe(400)
  })

  it('does not expose SQL or database errors for write failures', async () => {
    const handler = createBookmarkItemHandler({
      getSql: () => async () => { throw new Error('SQL syntax with private DB details') },
      writesEnabled: () => true,
      checkRateLimit: allowRateLimit,
    })
    const response = await invoke(handler, { method: 'DELETE', query: { id: '1' } })

    expect(response.statusCode).toBe(503)
    expect(JSON.stringify(response.body)).not.toContain('private DB details')
  })
})
