import 'server-only'

import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'b',
  'strong',
  'em',
  'i',
  'u',
  'p',
  'br',
  'ul',
  'ol',
  'li',
  'a',
  'span',
  'blockquote',
  'pre',
  'code',
  'h2',
  'h3',
  'h4',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'img',
] as const

const ALLOWED_ATTR = ['href', 'target', 'rel', 'title', 'src', 'alt'] as const

export function sanitizeNewsHtml(html: string): string {
  const processed = (html ?? '')
    .replace(/\\n/g, '<br />')
    .replace(/\r\n/g, '<br />')
    .replace(/\n/g, '<br />')

  const clean = DOMPurify.sanitize(processed, {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'],
    FORBID_ATTR: ['style'],
    KEEP_CONTENT: true,
  })

  // Extra defense: strip inline event handlers if any survive
  return clean.replace(/\son\w+="[^"]*"/gi, '').replace(/\son\w+='[^']*'/gi, '')
}

