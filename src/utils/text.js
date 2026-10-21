export function getTextStats(value) {
  return {
    characters: value.length,
    withoutWhitespace: value.replace(/[\s]/g, '').length,
    words: value.trim() ? value.trim().split(/\s+/u).length : 0,
    lines: value ? value.split(/\r\n|\n|\r/).length : 0,
  }
}

export function cleanText(value, operation) {
  const lines = value.split(/\r\n|\n|\r/)
  if (operation === 'trim') return value.trim()
  if (operation === 'blank') return lines.filter((line) => line.trim()).join('\n')
  if (operation === 'duplicate') return [...new Set(lines)] .join('\n')
  return value
}
