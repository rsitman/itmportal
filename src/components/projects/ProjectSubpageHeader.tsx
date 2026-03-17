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

export default function ProjectSubpageHeader({
  title,
  sectionLabel,
  dokladProjektu,
  projectName,
  returnTo,
  rightSlot,
}: ProjectSubpageHeaderProps) {
  const fallbackParent = `/projects/doklad-projektu/${encodeURIComponent(dokladProjektu)}`
  const backHref = safeInternalHref(returnTo) ?? fallbackParent
  const projectHref = fallbackParent

  const projectLabel = (projectName ?? '').trim() || dokladProjektu

  return (
    <header className="border-b border-gray-700/50 pb-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <nav className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href="/evidence-projektu"
              className="hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
            >
              Evidence projektů
            </Link>
            <span className="text-gray-700">→</span>
            <Link
              href={projectHref}
              className="hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
              title={dokladProjektu}
            >
              Projekt: {projectLabel}
            </Link>
            <span className="text-gray-700">→</span>
            <span className="text-gray-300">{sectionLabel}</span>
          </nav>

          <Link
            href={backHref}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-gray-600/50 bg-gray-800/50 text-xs text-gray-300 hover:text-gray-100 hover:bg-gray-700/60 hover:border-gray-500/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 w-fit"
          >
            ← Zpět
          </Link>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">{title}</h1>
            {projectName ? (
              <p className="mt-1 text-sm font-medium text-gray-200 leading-snug">
                {projectName}
                <span className="ml-1.5 text-[11px] font-normal text-gray-500 font-mono">
                  · {dokladProjektu}
                </span>
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

