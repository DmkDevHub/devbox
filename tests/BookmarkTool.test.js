import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import BookmarkTool from '../src/tools/BookmarkTool.vue'
import { getSafeHttpUrl } from '../src/utils/url.js'

describe('BookmarkTool rendered structure', () => {
  it('shows the public sharing and privacy warning with accessible form fields', async () => {
    const html = await renderToString(createSSRApp(BookmarkTool))

    expect(html).toContain('누구나 등록, 수정, 삭제할 수 있으므로 개인정보나 비공개 URL을 등록하지 마세요.')
    expect(html).toContain('id="bookmark-title"')
    expect(html).toContain('id="bookmark-url"')
    expect(html).toContain('id="bookmark-category"')
    expect(html).toContain('id="bookmark-description"')
    expect(html).toContain('role="note"')
    expect(html).toContain('북마크 등록')
    expect(html).toContain('아직 등록된 북마크가 없어요.')
  })
})

describe('bookmark external URL safety', () => {
  it.each([
    ['https://example.com/path', 'https://example.com/path'],
    ['http://example.com', 'http://example.com/'],
    ['javascript:alert(1)', ''],
    ['data:text/html,<script>alert(1)</script>', ''],
    ['not a URL', ''],
  ])('allows only safe web links: %s', (input, expected) => {
    expect(getSafeHttpUrl(input)).toBe(expected)
  })
})
