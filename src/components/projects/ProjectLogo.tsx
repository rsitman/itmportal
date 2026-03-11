'use client'

import { useState, useMemo } from 'react'

function getInitials(name: string | null | undefined): string {
  const s = (name ?? '').toString().trim()
  if (!s) return '—'
  const words = s.split(/[\s,]+/).filter(Boolean)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase().slice(0, 2)
  }
  return s.slice(0, 2).toUpperCase()
}

export type ProjectLogoSize = 'sm' | 'md'

const sizeClasses: Record<ProjectLogoSize, string> = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-sm',
}

export interface ProjectLogoProps {
  /** Logo image src: data URL or base64 string (without data: prefix – will be normalized) */
  logo?: string | null
  /** Name used for fallback initials when logo is missing or fails to load */
  fallbackName?: string | null
  size?: ProjectLogoSize
  className?: string
  /** Optional alt for img */
  alt?: string
}

export default function ProjectLogo({
  logo,
  fallbackName,
  size = 'md',
  className = '',
  alt = '',
}: ProjectLogoProps) {
  const [imgError, setImgError] = useState(false)

  const src = useMemo(() => {
    if (!logo || imgError) return null
    const raw = logo.trim()
    if (raw.startsWith('data:')) return raw
    return `data:image/png;base64,${raw}`
  }, [logo, imgError])

  const showFallback = !src || imgError
  const initials = getInitials(fallbackName)

  const boxClass = sizeClasses[size]

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-md border border-gray-600/50 bg-gray-800/80 p-1 ${boxClass} ${className}`}
      title={fallbackName ?? undefined}
    >
      {showFallback ? (
        <span
          className="font-semibold text-gray-300 select-none"
          aria-hidden
        >
          {initials}
        </span>
      ) : (
        <img
          src={src!}
          alt={alt || fallbackName || 'Logo'}
          className="h-full w-full object-contain"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  )
}
