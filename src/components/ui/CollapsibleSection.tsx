'use client'

import { ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

  const handleClick = () => {
    if (href) {
      router.push(href)
    } else {
      setIsOpen(!isOpen)
    }
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  return (
    <div className={cn('space-y-1', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center w-full rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
          isActive && !href
            ? 'bg-gray-800/80 text-gray-100 shadow-sm'
            : isActive && href
            ? 'bg-green-600/20 text-green-100 shadow-sm border-l-2 border-green-500'
            : 'text-gray-400 hover:bg-gray-800/80 hover:text-gray-200'
        )}
      >
        <Icon className={cn(
          'mr-3 h-4 w-4 transition-colors duration-200',
          isActive && !href
            ? 'text-gray-100'
            : isActive && href
            ? 'text-green-400'
            : 'text-gray-400'
        )} />
        <span className="flex-1 text-left font-semibold">{title}</span>
        {href && hasVisibleChildren && (
          <span
            onClick={handleToggle}
            className="p-1 hover:bg-gray-700 rounded cursor-pointer"
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </span>
        )}
        {!href && hasVisibleChildren && (isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        ))}
      </button>
      
      {isOpen && (
        <div className="ml-6 space-y-1">
          {children}
        </div>
      )}
    </div>
  )
}
