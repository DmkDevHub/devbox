import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createBookmark,
  deleteBookmark,
  getBookmark,
  getBookmarks,
  updateBookmark,
} from '../src/services/bookmarkApi.js'

afterEach(() => vi.unstubAllGlobals())

function jsonResponse(body, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name] ?? null },
    json: async () => body,
  }
}

describe('bookmark API client', () => {
  it('requests paginated results with encoded search and category filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [], pagination: { page: 2, limit: 20, total: 0 } }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getBookmarks({ page: 2, search: '한글 & Vue', category: 'Frontend' })

    expect(result.pagination.page).toBe(2)
    expect(fetchMock.mock.calls[0][0]).toContain('search=%ED%95%9C%EA%B8%80+%26+Vue')
    expect(fetchMock.mock.calls[0][0]).toContain('category=Frontend')
  })

  it('gets a single bookmark using an encoded ID', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { id: '7' } }))
    vi.stubGlobal('fetch', fetchMock)

    await getBookmark('7/unsafe')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/bookmarks/7%2Funsafe')
  })

  it('posts JSON and returns the created bookmark response', async () => {
    const bookmark = { title: '한글 문서', url: 'https://example.com' }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { id: '1', ...bookmark } }, 201))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createBookmark(bookmark)

    expect(result.data.id).toBe('1')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify(bookmark) })
    expect(fetchMock.mock.calls[0][1].headers['Content-Type']).toBe('application/json')
  })

  it('puts an edit and sends DELETE without parsing a 204 body', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: { id: '5', title: 'updated' } }))
      .mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null } })
    vi.stubGlobal('fetch', fetchMock)

    await updateBookmark('5', { title: 'updated' })
    const deleted = await deleteBookmark('5')

    expect(fetchMock.mock.calls[0][1].method).toBe('PUT')
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE')
    expect(deleted).toBeNull()
  })

  it('preserves API error status and retry timing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      error: { code: 'RATE_LIMITED', message: '잠시 후 다시 시도해 주세요.' },
    }, 429, { 'Retry-After': '30' })))

    await expect(createBookmark({})).rejects.toMatchObject({
      message: '잠시 후 다시 시도해 주세요.',
      status: 429,
      code: 'RATE_LIMITED',
      retryAfter: '30',
    })
  })

  it('returns a clear error when the API cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('connection refused')))

    await expect(getBookmarks()).rejects.toThrow('서버에 연결할 수 없습니다')
  })

  it('preserves an aborted request so stale searches do not show a network error', async () => {
    const abortError = new DOMException('Aborted', 'AbortError')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError))

    await expect(getBookmarks({ signal: new AbortController().signal })).rejects.toMatchObject({ name: 'AbortError' })
  })
})
