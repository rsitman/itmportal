import 'server-only'

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
const VOID_TAGS = new Set(['br', 'hr', 'img'])

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false

  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true

  try {
    const url = new URL(trimmed)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)
  } catch {
    return false
  }
}

function sanitizeAttributes(tagName: string, rawAttributes: string): string {
  const attributes: string[] = []
  const attrPattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

  for (const match of rawAttributes.matchAll(attrPattern)) {
    const name = match[1].toLowerCase()
    const value = match[3] ?? match[4] ?? match[5] ?? ''

    if (!ALLOWED_ATTR.includes(name as (typeof ALLOWED_ATTR)[number])) continue
    if (name.startsWith('on')) continue
    if ((name === 'href' || name === 'src') && !isSafeUrl(value)) continue
    if (tagName !== 'a' && (name === 'href' || name === 'target' || name === 'rel')) continue
    if (tagName !== 'img' && name === 'src') continue

    attributes.push(`${name}="${escapeAttribute(value)}"`)
  }

  if (tagName === 'a') {
    const hasTargetBlank = attributes.some((attr) => attr === 'target="_blank"')
    const hasRel = attributes.some((attr) => attr.startsWith('rel='))
    if (hasTargetBlank && !hasRel) attributes.push('rel="noopener noreferrer"')
  }

  return attributes.length > 0 ? ` ${attributes.join(' ')}` : ''
}

export function sanitizeNewsHtml(html: string): string {
  const processed = (html ?? '')
    .replace(/\\n/g, '<br />')
    .replace(/\r\n/g, '<br />')
    .replace(/\n/g, '<br />')

  return processed
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|link|meta)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, '')
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (fullTag, rawTagName: string, rawAttributes: string) => {
      const tagName = rawTagName.toLowerCase()
      if (!ALLOWED_TAGS.includes(tagName as (typeof ALLOWED_TAGS)[number])) return ''

      const isClosing = /^<\s*\//.test(fullTag)
      if (isClosing) return VOID_TAGS.has(tagName) ? '' : `</${tagName}>`

      const attrs = sanitizeAttributes(tagName, rawAttributes)
      return VOID_TAGS.has(tagName) ? `<${tagName}${attrs}>` : `<${tagName}${attrs}>`
    })
}

