'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

type Props = {
  options: string[]
  selected: string[]
  counts: Map<string, number>
  onToggle: (oblast: string) => void
  onClear: () => void
}

function formatSelectionLabel(selected: string[]): string {
  if (selected.length === 0) return 'Všechny oblasti'
  if (selected.length === 1) return selected[0] ?? 'Všechny oblasti'
  if (selected.length === 2) return selected.join(', ')
  return `${selected.length} vybrané oblasti`
}

export default function AktualityOblastFilter({ options, selected, counts, onToggle, onClear }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const labelId = `${listboxId}-label`

  const selectionLabel = useMemo(() => formatSelectionLabel(selected), [selected])
  const hasSelection = selected.length > 0

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (options.length === 0) return null

  return (
    <div ref={containerRef} className="relative w-full sm:w-80">
      <label id={labelId} htmlFor={listboxId} className="block text-xs font-medium text-gray-400 mb-0.5">
        Oblast
      </label>

      <button
        id={listboxId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => setOpen((value) => !value)}
        className="w-full inline-flex items-center justify-between gap-2 pl-3 pr-2.5 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
      >
        <span className={`truncate ${hasSelection ? 'text-white' : 'text-gray-400'}`}>{selectionLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-labelledby={labelId}
          aria-multiselectable="true"
          className="absolute z-20 mt-1 w-full rounded-lg border border-gray-600/60 bg-gray-900 shadow-xl overflow-hidden"
        >
          {hasSelection ? (
            <div className="border-b border-gray-700/50 px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  onClear()
                  setOpen(false)
                }}
                className="text-xs text-gray-300 hover:text-white underline underline-offset-2"
              >
                Zrušit filtr
              </button>
            </div>
          ) : null}

          <ul className="max-h-60 overflow-y-auto py-1">
            {options.map((oblast) => {
              const checked = selected.includes(oblast)
              const count = counts.get(oblast) ?? 0
              return (
                <li key={oblast}>
                  <label className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(oblast)}
                      className="h-4 w-4 rounded bg-gray-800 border-gray-600 text-green-500 focus:ring-green-500/60"
                    />
                    <span className="flex-1 min-w-0 text-sm text-gray-200 truncate">{oblast}</span>
                    <span className="text-xs text-gray-500 shrink-0">({count})</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
