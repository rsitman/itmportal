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
}

export default function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  isActive = false,
  className = '',
  href
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
          isActive
            ? 'bg-blue-50 text-blue-700 shadow-sm'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
      >
        <Icon className="mr-3 h-4 w-4" />
        <span className="flex-1 text-left font-semibold">{title}</span>
        {href && (
          <span
            onClick={handleToggle}
            className="p-1 hover:bg-gray-200 rounded cursor-pointer"
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
        {!href && (isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
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
