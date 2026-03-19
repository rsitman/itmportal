export default function NewsHtml({ sanitizedHtml }: { sanitizedHtml: string }) {
  if (!sanitizedHtml) return null
  return (
    <div
      className="news-content"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
