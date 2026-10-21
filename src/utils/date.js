export function timestampToDate(value, unit = 'seconds') {
  if (!String(value).trim()) throw new Error('Unix timestamp를 입력해 주세요.')
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error('숫자 형식의 timestamp를 입력해 주세요.')
  const milliseconds = unit === 'seconds' ? number * 1000 : number
  const date = new Date(milliseconds)
  if (Number.isNaN(date.getTime())) throw new Error('날짜 범위를 벗어난 timestamp입니다.')
  return date
}

export function dateToTimestamp(value) {
  if (!value) throw new Error('날짜와 시간을 입력해 주세요.')
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('올바른 날짜와 시간을 입력해 주세요.')
  return date
}
