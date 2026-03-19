export function htmlToPlainText(input: string): string {
  const s = (input ?? '').toString()
  // Normalize escaped newlines from ERP (literal "\n") + real whitespace
  const normalized = s
    .replace(/\\r\\n|\\n|\\r|\\t/g, ' ')
    .replace(/\r\n|\n|\r|\t/g, ' ')

  return normalized
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function toExcerpt(text: string, maxLen: number): string {
  const t = (text ?? '').trim()
  if (!t) return ''
  if (t.length <= maxLen) return t
  return t.slice(0, maxLen).trimEnd() + '…'
}

export function htmlToPlainTextExcerpt(html: string, maxLen: number): string {
  return toExcerpt(htmlToPlainText(html), maxLen)
}

