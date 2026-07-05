import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.use({
  gfm: true,
  breaks: true
})

export function renderMarkdown(markdown = '') {
  const rawHtml = marked.parse(String(markdown), {
    async: false
  })

  return DOMPurify.sanitize(rawHtml)
}
