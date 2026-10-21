import { describe, expect, it } from 'vitest'
import { formatJson } from '../src/utils/json.js'
import { encodeBase64, decodeBase64 } from '../src/utils/base64.js'
import { dateToTimestamp, timestampToDate } from '../src/utils/date.js'
import { generateUuid } from '../src/utils/uuid.js'
import { cleanText, getTextStats } from '../src/utils/text.js'
import { formatSql } from '../src/utils/sql.js'
import { createDatabaseClient, verifyDatabaseConnection } from '../api/_lib/db.js'

describe('JSON formatter', () => {
  it('pretty prints and compacts JSON with Unicode intact', () => {
    expect(formatJson('{"name":"한글🙂","ok":true}')).toContain('\n  "name": "한글🙂"')
    expect(formatJson('{"name":"한글🙂","ok":true}', true)).toBe('{"name":"한글🙂","ok":true}')
    expect(formatJson('null')).toBe('null')
  })
  it('rejects empty and malformed JSON', () => {
    expect(() => formatJson('  ')).toThrow('JSON을 입력')
    expect(() => formatJson('{bad')).toThrow()
  })
})

describe('Base64 converter', () => {
  it.each(['Hello', '한글 입력', 'DevBox 🙂'])('round trips UTF-8 text: %s', (value) => {
    expect(decodeBase64(encodeBase64(value))).toBe(value)
  })
  it('rejects malformed Base64 and invalid UTF-8 bytes', () => {
    expect(() => decodeBase64('not base64!')).toThrow('Base64')
    expect(() => decodeBase64('/w==')).toThrow('UTF-8')
  })
})

describe('Date converter', () => {
  it('converts seconds and milliseconds including leap day boundaries', () => {
    const leapDay = new Date('2024-02-29T12:34:56.789Z')
    expect(timestampToDate(leapDay.getTime(), 'milliseconds').toISOString()).toBe(leapDay.toISOString())
    expect(timestampToDate(Math.floor(leapDay.getTime() / 1000), 'seconds').toISOString()).toBe('2024-02-29T12:34:56.000Z')
    expect(dateToTimestamp('2024-02-29T12:34:56.789Z').getTime()).toBe(leapDay.getTime())
  })
  it('rejects empty, nonnumeric and out-of-range timestamps', () => {
    expect(() => timestampToDate('')).toThrow()
    expect(() => timestampToDate('abc')).toThrow()
    expect(() => timestampToDate('1e100')).toThrow()
    expect(() => dateToTimestamp('not-a-date')).toThrow()
  })
})

describe('UUID v4 generator', () => {
  it('returns UUID v4 strings with valid version and variant bits', () => {
    expect(generateUuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(new Set(Array.from({ length: 100 }, generateUuid)).size).toBe(100)
  })
})

describe('Text tools', () => {
  it('counts Korean text, whitespace, words and lines', () => {
    expect(getTextStats('한글 text\n두 줄')).toEqual({ characters: 11, withoutWhitespace: 8, words: 4, lines: 2 })
    expect(getTextStats('')).toEqual({ characters: 0, withoutWhitespace: 0, words: 0, lines: 0 })
  })
  it('trims, removes blank lines and removes exact duplicate lines in first-seen order', () => {
    expect(cleanText('  hi\n', 'trim')).toBe('hi')
    expect(cleanText('a\n \nb', 'blank')).toBe('a\nb')
    expect(cleanText('a\nA\na', 'duplicate')).toBe('a\nA')
  })
})

describe('SQL formatter', () => {
  it('formats PostgreSQL statements and applies keyword case and indentation', () => {
    const result = formatSql('select id,title from bookmarks where id=1', { dialect: 'postgresql', keywordCase: 'upper', tabWidth: 4 })
    expect(result).toContain('SELECT')
    expect(result).toContain('FROM\n    bookmarks')
    expect(result).toContain('    id')
  })
  it('supports Oracle PL/SQL dialect and rejects empty input', () => {
    expect(formatSql('select * from (select id from users where rownum <= 10)', { dialect: 'oracle' })).toContain('SELECT')
    expect(() => formatSql('')).toThrow('SQL을 입력')
  })
  it('formats joins and preserves SQL comments', () => {
    const joined = formatSql('select u.id, p.name from users u inner join profiles p on p.user_id=u.id where u.id=1')
    expect(joined).toContain('JOIN')
    const commented = formatSql('-- keep this comment\nSELECT id FROM bookmarks')
    expect(commented).toContain('-- keep this comment')
  })
  it.each([
    'INSERT INTO bookmarks (title, url) VALUES (\'DevBox\', \'https://example.com\')',
    'UPDATE bookmarks SET title = \'Updated\' WHERE id = 1',
    'DELETE FROM bookmarks WHERE id = 1',
    'SELECT id FROM bookmarks GROUP BY id ORDER BY id',
    '-- keep this comment\nSELECT id FROM bookmarks WHERE id = 1',
  ])('formats statement and comment syntax: %s', (query) => {
    expect(formatSql(query)).toBeTruthy()
  })
})

describe('Neon database connection helpers', () => {
  it('requires a database URL without revealing the value', () => {
    expect(() => createDatabaseClient('')).toThrow('DATABASE_URL')
  })
  it('runs a parameter-free connectivity query through the injected client', async () => {
    let queryText = ''
    const query = async (parts) => { queryText = parts.join('?'); return [{ connected: 1 }] }
    await expect(verifyDatabaseConnection(query)).resolves.toBe(true)
    expect(queryText).toBe('SELECT 1 AS connected')
  })
  it('returns a sanitized connection error', async () => {
    const query = async () => { throw new Error('secret-host password=do-not-show') }
    await expect(verifyDatabaseConnection(query)).rejects.toThrow('Neon 데이터베이스 연결에 실패했습니다.')
    await expect(verifyDatabaseConnection(query)).rejects.not.toThrow('secret-host')
  })
})
