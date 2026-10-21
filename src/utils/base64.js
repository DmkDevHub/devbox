export function encodeBase64(value) {
  return btoa(Array.from(new TextEncoder().encode(value), (byte) => String.fromCharCode(byte)).join(''))
}

export function decodeBase64(value) {
  const normalized = value.replace(/[\t\n\r ]/g, '')
  if (!normalized || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(normalized)) {
    throw new Error('올바른 Base64 문자열을 입력해 주세요.')
  }
  const bytes = Uint8Array.from(atob(normalized), (char) => char.charCodeAt(0))
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new Error('입력값을 UTF-8 텍스트로 해석할 수 없습니다.')
  }
}
