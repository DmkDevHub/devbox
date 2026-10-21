async function request(path = '', options = {}) {
  let response
  try {
    response = await fetch(`/api/bookmarks${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.')
  }

  if (response.status === 204) return null

  let result
  try {
    result = await response.json()
  } catch {
    result = null
  }

  if (!response.ok) {
    const error = new Error(result?.error?.message || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    error.status = response.status
    error.code = result?.error?.code
    error.retryAfter = response.headers.get('Retry-After')
    throw error
  }

  return result
}

export function getBookmarks({ page = 1, limit = 20, search = '', category = '', signal } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) query.set('search', search)
  if (category) query.set('category', category)
  return request(`?${query}`, { signal })
}

export function getBookmark(id, options = {}) {
  return request(`/${encodeURIComponent(id)}`, options)
}

export function createBookmark(bookmark) {
  return request('', { method: 'POST', body: JSON.stringify(bookmark) })
}

export function updateBookmark(id, bookmark) {
  return request(`/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(bookmark) })
}

export function deleteBookmark(id) {
  return request(`/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
