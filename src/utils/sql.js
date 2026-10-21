import { format } from 'sql-formatter'

export function formatSql(input, { dialect = 'postgresql', keywordCase = 'upper', tabWidth = 2 } = {}) {
  if (!input.trim()) throw new Error('SQL을 입력해 주세요.')
  return format(input, {
    language: dialect === 'oracle' ? 'plsql' : 'postgresql',
    keywordCase,
    tabWidth: Number(tabWidth),
    useTabs: false,
  })
}
