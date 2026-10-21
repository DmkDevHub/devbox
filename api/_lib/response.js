export function sendError(res, status, code, message, headers = {}) {
  for (const [name, value] of Object.entries(headers)) {
    res.setHeader(name, value)
  }

  return res.status(status).json({
    error: { code, message },
  })
}

export function sendMethodNotAllowed(res, allowedMethods) {
  return sendError(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 HTTP 메서드입니다.', {
    Allow: allowedMethods.join(', '),
  })
}

export function sendDatabaseError(res) {
  return sendError(res, 503, 'DATABASE_UNAVAILABLE', '데이터베이스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
}
