'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

interface EventFilters {
  showLocal: boolean
  showErp: boolean
  showOutlook: boolean
  categories: {
    MEETING: boolean
    OTHER: boolean
    ERP_UPGRADE: boolean
    ERP_PATCH: boolean
    ERP_HOLIDAY: boolean
  }
}

interface EventFilterPanelProps {
  filters: EventFilters
  onFiltersChange: (filters: EventFilters) => void
}

const categoryColors = {
  MEETING: '#f97316', 
  OTHER: '#6b7280',
  ERP_UPGRADE: '#8b5cf6',
  ERP_PATCH: '#a855f7',
  ERP_HOLIDAY: '#22c55e',
}

const categoryLabels = {
  MEETING: 'Schůzky',
  OTHER: 'Ostatní',
  ERP_UPGRADE: 'ERP Upgrady',
  ERP_PATCH: 'ERP Patche',
  ERP_HOLIDAY: 'ERP Dovolené',
}

export default function EventFilterPanel({ filters, onFiltersChange }: EventFilterPanelProps) {
  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('calendarFilters')
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters)
        onFiltersChange(parsed)
      } catch (error) {
        logger.error('Failed to parse saved filters:', error)
      }
    }
  }, [])

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem('calendarFilters', JSON.stringify(filters))
  }, [filters])

  const handleSourceFilterChange = (source: keyof EventFilters, value: boolean) => {
    onFiltersChange({
      ...filters,
      [source]: value
    })
  }

  const handleCategoryFilterChange = (category: keyof EventFilters['categories'], value: boolean) => {
    onFiltersChange({
      ...filters,
      categories: {
        ...filters.categories,
        [category]: value
      }
    })
  }

  const resetFilters = () => {
    const defaultFilters: EventFilters = {
      showLocal: true,
      showErp: true,
      showOutlook: true,
      categories: {
        MEETING: true,
        OTHER: true,
        ERP_UPGRADE: true,
        ERP_PATCH: true,
        ERP_HOLIDAY: true,
      }
    }
    onFiltersChange(defaultFilters)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Filtr událostí</h3>
        <button
          onClick={resetFilters}
          className="px-2.5 py-1 text-xs border border-gray-600/70 rounded-md bg-gray-800/80 text-gray-200 hover:bg-gray-700/80 transition-colors"
        >
          Resetovat
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <div className="space-y-1.5">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Zdroje událostí
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showLocal}
                onChange={(e) => handleSourceFilterChange('showLocal', e.target.checked)}
                className="h-4 w-4 rounded bg-gray-800 border-gray-600 text-green-500 focus:ring-green-500/60"
              />
              <span className="text-xs text-gray-300">Lokální</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showErp}
                onChange={(e) => handleSourceFilterChange('showErp', e.target.checked)}
                className="h-4 w-4 rounded bg-gray-800 border-gray-600 text-purple-500 focus:ring-purple-500/60"
              />
              <span className="text-xs text-gray-300">ERP</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showOutlook}
                onChange={(e) => handleSourceFilterChange('showOutlook', e.target.checked)}
                className="h-4 w-4 rounded bg-gray-800 border-gray-600 text-green-500 focus:ring-green-500/60"
              />
              <span className="text-xs text-gray-300">Outlook</span>
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Kategorie
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {Object.entries(categoryLabels).map(([category, label]) => (
              <label key={category} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories[category as keyof EventFilters['categories']]}
                  onChange={(e) =>
                    handleCategoryFilterChange(
                      category as keyof EventFilters['categories'],
                      e.target.checked,
                    )
                  }
                  className="h-4 w-4 rounded bg-gray-800 border-gray-600 focus:ring-gray-500/60"
                  style={{ accentColor: categoryColors[category as keyof typeof categoryColors] }}
                />
                <div className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors] }}
                  />
                  <span className="text-xs text-gray-300">{label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
