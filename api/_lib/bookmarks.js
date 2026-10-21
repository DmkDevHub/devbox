import { createDatabaseClient } from './db.js'
import { createRateLimiter, enforceRateLimit } from './rateLimit.js'
import { sendDatabaseError, sendError, sendMethodNotAllowed } from './response.js'
import { bookmarkIdSchema, listQuerySchema, parseBookmarkBody } from './validation.js'

const writesEnabledByDefault = () => process.env.PUBLIC_WRITES_ENABLED === 'true'

function bookmarkFromRow(row) {
  return {
    id: String(row.id),
    title: row.title,
    url: row.url,
    category: row.category ?? null,
    description: row.description ?? null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function isWritesEnabled(res, enabled) {
  if (enabled()) return true

  sendError(res, 503, 'WRITES_DISABLED', '북마크 쓰기 기능은 현재 비활성화되어 있습니다.')
  return false
}

function validationError(res) {
  return sendError(res, 400, 'VALIDATION_ERROR', '입력값을 확인해 주세요.')
}

function requestTooLarge(res) {
  return sendError(res, 413, 'PAYLOAD_TOO_LARGE', '요청 본문은 16KB 이하여야 합니다.')
}

export function createBookmarksCollectionHandler({
  getSql = createDatabaseClient,
  writesEnabled = writesEnabledByDefault,
  checkRateLimit = createRateLimiter({ getSql }),
} = {}) {
  return async function bookmarksCollectionHandler(req, res) {
    if (!['GET', 'POST'].includes(req.method)) {
      return sendMethodNotAllowed(res, ['GET', 'POST'])
    }

    if (req.method === 'POST' && !isWritesEnabled(res, writesEnabled)) return undefined
    if (!await enforceRateLimit(req, res, checkRateLimit)) return undefined

    if (req.method === 'GET') {
      const parsedQuery = listQuerySchema.safeParse(req.query ?? {})
      if (!parsedQuery.success) return validationError(res)

      const { page, limit, search, category } = parsedQuery.data
      const offset = (page - 1) * limit
      if (!Number.isSafeInteger(offset)) return validationError(res)

      try {
        const sql = getSql()
        const rows = await sql`
          SELECT id::text AS id, title, url, category, description, created_at, updated_at
          FROM bookmarks
          WHERE (${search} = '' OR title ILIKE '%' || ${search} || '%')
            AND (${category} = '' OR category = ${category})
          ORDER BY created_at DESC, id DESC
          LIMIT ${limit} OFFSET ${offset}
        `
        const totals = await sql`
          SELECT COUNT(*)::text AS total
          FROM bookmarks
          WHERE (${search} = '' OR title ILIKE '%' || ${search} || '%')
            AND (${category} = '' OR category = ${category})
        `

        return res.status(200).json({
          data: rows.map(bookmarkFromRow),
          pagination: { page, limit, total: Number(totals[0]?.total ?? 0) },
        })
      } catch {
        return sendDatabaseError(res)
      }
    }

    const parsedBody = parseBookmarkBody(req)
    if (parsedBody.tooLarge) return requestTooLarge(res)
    if (parsedBody.error) return validationError(res)

    try {
      const rows = await getSql()`
        INSERT INTO bookmarks (title, url, category, description)
        VALUES (${parsedBody.data.title}, ${parsedBody.data.url}, ${parsedBody.data.category}, ${parsedBody.data.description})
        RETURNING id::text AS id, title, url, category, description, created_at, updated_at
      `

      return res.status(201).json({ data: bookmarkFromRow(rows[0]) })
    } catch {
      return sendDatabaseError(res)
    }
  }
}

export function createBookmarkItemHandler({
  getSql = createDatabaseClient,
  writesEnabled = writesEnabledByDefault,
  checkRateLimit = createRateLimiter({ getSql }),
} = {}) {
  return async function bookmarkItemHandler(req, res) {
    if (!['GET', 'PUT', 'DELETE'].includes(req.method)) {
      return sendMethodNotAllowed(res, ['GET', 'PUT', 'DELETE'])
    }

    if (req.method !== 'GET' && !isWritesEnabled(res, writesEnabled)) return undefined
    if (!await enforceRateLimit(req, res, checkRateLimit)) return undefined

    const parsedId = bookmarkIdSchema.safeParse(req.query?.id ?? req.params?.id)
    if (!parsedId.success) return validationError(res)
    const id = parsedId.data

    if (req.method === 'GET') {
      try {
        const rows = await getSql()`
          SELECT id::text AS id, title, url, category, description, created_at, updated_at
          FROM bookmarks
          WHERE id = ${id}::bigint
          LIMIT 1
        `
        if (!rows.length) return sendError(res, 404, 'NOT_FOUND', '북마크를 찾을 수 없습니다.')
        return res.status(200).json({ data: bookmarkFromRow(rows[0]) })
      } catch {
        return sendDatabaseError(res)
      }
    }

    if (req.method === 'PUT') {
      const parsedBody = parseBookmarkBody(req)
      if (parsedBody.tooLarge) return requestTooLarge(res)
      if (parsedBody.error) return validationError(res)

      try {
        const rows = await getSql()`
          UPDATE bookmarks
          SET title = ${parsedBody.data.title}, url = ${parsedBody.data.url},
            category = ${parsedBody.data.category}, description = ${parsedBody.data.description}
          WHERE id = ${id}::bigint
          RETURNING id::text AS id, title, url, category, description, created_at, updated_at
        `
        if (!rows.length) return sendError(res, 404, 'NOT_FOUND', '북마크를 찾을 수 없습니다.')
        return res.status(200).json({ data: bookmarkFromRow(rows[0]) })
      } catch {
        return sendDatabaseError(res)
      }
    }

    try {
      const rows = await getSql()`
        DELETE FROM bookmarks
        WHERE id = ${id}::bigint
        RETURNING id::text AS id
      `
      if (!rows.length) return sendError(res, 404, 'NOT_FOUND', '북마크를 찾을 수 없습니다.')
      return res.status(204).end()
    } catch {
      return sendDatabaseError(res)
    }
  }
}
