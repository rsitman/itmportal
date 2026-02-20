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
    <div className="card-professional p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Filtr událostí</h3>
        <button
          onClick={resetFilters}
          className="px-3 py-1 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
        >
          Resetovat
        </button>
      </div>

      {/* Source filters */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Zdroje událostí</h4>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showLocal}
              onChange={(e) => handleSourceFilterChange('showLocal', e.target.checked)}
              className="rounded text-green-600 focus:ring-blue-500 bg-gray-700 border-gray-600"
            />
            <span className="text-sm text-gray-300">Lokální</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showErp}
              onChange={(e) => handleSourceFilterChange('showErp', e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500 bg-gray-700 border-gray-600"
            />
            <span className="text-sm text-gray-300">ERP</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showOutlook}
              onChange={(e) => handleSourceFilterChange('showOutlook', e.target.checked)}
              className="rounded text-green-600 focus:ring-blue-500 bg-gray-700 border-gray-600"
            />
            <span className="text-sm text-gray-300">Outlook</span>
          </label>
        </div>
      </div>

      {/* Category filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Kategorie událostí</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {Object.entries(categoryLabels).map(([category, label]) => (
            <label key={category} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories[category as keyof EventFilters['categories']]}
                onChange={(e) => handleCategoryFilterChange(category as keyof EventFilters['categories'], e.target.checked)}
                className="rounded focus:ring-gray-500 bg-gray-700 border-gray-600"
                style={{ accentColor: categoryColors[category as keyof typeof categoryColors] }}
              />
              <div className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors] }}
                />
                <span className="text-sm text-gray-300">{label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
