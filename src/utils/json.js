export function formatJson(input, compact = false) {
  if (!input.trim()) throw new Error('JSON을 입력해 주세요.')
  const value = JSON.parse(input)
  return JSON.stringify(value, null, compact ? 0 : 2)
}
