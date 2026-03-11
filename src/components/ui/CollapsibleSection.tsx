'use client'

import { ReactNode, useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: ReactNode
  defaultOpen?: boolean
  isActive?: boolean
  className?: string
  href?: string
  hasVisibleChildren?: boolean
}

/** Parent groups are toggle-only (no href). Click = expand/collapse. Active route opens section. */
export default function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  isActive = false,
  className = '',
  href,
  hasVisibleChildren = true
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  useEffect(() => {
    if (defaultOpen) setIsOpen(true)
  }, [defaultOpen])

  const handleClick = () => {
    setIsOpen(prev => !prev)
  }

  return (
    <div className={cn('space-y-1', className)}>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'flex items-center w-full rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-gray-800/80 text-gray-100 shadow-sm'
            : 'text-gray-400 hover:bg-gray-800/80 hover:text-gray-200'
        )}
      >
        <Icon className={cn(
          'mr-3 h-4 w-4 transition-colors duration-200',
          isActive ? 'text-gray-100' : 'text-gray-400'
        )} />
        <span className="flex-1 text-left font-semibold">{title}</span>
        {hasVisibleChildren && (
          isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
          )
        )}
      </button>
      
      {isOpen && (
        <div className="ml-6 space-y-1">
          {children}
        </div>
      )}
    </div>
  )
}
