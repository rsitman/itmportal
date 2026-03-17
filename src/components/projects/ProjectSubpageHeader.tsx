import Link from 'next/link'

type ProjectSubpageHeaderProps = {
  title: string
  sectionLabel: string
  dokladProjektu: string
  projectName?: string | null
  returnTo?: string | null
  rightSlot?: React.ReactNode
}

function safeInternalHref(value: string | undefined | null): string | null {
  const v = (value ?? '').trim()
  if (!v) return null
  if (!v.startsWith('/')) return null
  if (v.startsWith('//')) return null
  return v
}

function extractNestedReturnTo(href: string | null): string | null {
  const safeHref = safeInternalHref(href)
  if (!safeHref) return null
  try {
    const url = new URL(safeHref, 'http://local')
    const nested = url.searchParams.get('returnTo')
    return safeInternalHref(nested)
  } catch {
    return null
  }
}

export default function ProjectSubpageHeader({
  title,
  sectionLabel,
  dokladProjektu,
  projectName,
  returnTo,
  rightSlot,
}: ProjectSubpageHeaderProps) {
  const fallbackParent = `/projects/doklad-projektu/${encodeURIComponent(dokladProjektu)}`
  const projectHref = safeInternalHref(returnTo) ?? fallbackParent
  const evidenceHref = extractNestedReturnTo(projectHref) ?? '/evidence-projektu'

  const projectLabel = (projectName ?? '').trim() || dokladProjektu

  return (
    <header className="border-b border-gray-700/50 pb-4">
      <div className="flex flex-col gap-2.5">
        <nav className="text-[11px] text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={evidenceHref}
            className="group inline-flex items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <span className="text-gray-500 group-hover:text-gray-300 transition-colors">
              Evidence projektů
            </span>
          </Link>
          <span className="text-gray-700">/</span>
          <Link
            href={projectHref}
            className="group inline-flex items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            title={dokladProjektu}
          >
            <span className="text-gray-500 group-hover:text-gray-300 transition-colors">
              Projekt: {projectLabel}
            </span>
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-gray-300">{sectionLabel}</span>
        </nav>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
              {title}
            </h1>
            {projectName ? (
              <p className="mt-1 text-sm text-gray-200 leading-snug">
                <span className="font-medium text-gray-200">{projectName}</span>
                <span className="mx-1.5 text-gray-600">·</span>
                <span className="text-[11px] text-gray-500 font-mono">{dokladProjektu}</span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-200 leading-snug">
                <span className="text-[11px] text-gray-500 font-mono">{dokladProjektu}</span>
              </p>
            )}
          </div>

          {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
        </div>
      </div>
    </header>
  )
}

