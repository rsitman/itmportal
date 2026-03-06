'use client'

import { MetaResource, MetaField } from '@/types/meta'

interface MetaDetailProps {
  meta: MetaResource
  data: any
}

function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—'
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return '—'
  
  return date.toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function renderFieldValue(field: MetaField, value: any): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400">—</span>
  }

  switch (field.type) {
    case 'date':
      return formatDate(value)

    case 'boolean':
      return (
        <span
          className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${
            value
              ? 'bg-emerald-900/50 text-emerald-200 border-emerald-500/60'
              : 'bg-red-900/50 text-red-200 border-red-500/60'
          }`}
        >
          {value ? 'Ano' : 'Ne'}
        </span>
      )

    case 'enum':
      if (field.id === 'status') {
        const statusColors = {
          'ACTIVE': 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/70',
          'INACTIVE': 'bg-slate-900/60 text-slate-200 border border-slate-600/70',
          'ARCHIVED': 'bg-amber-900/60 text-amber-200 border border-amber-500/70',
          'SUSPENDED': 'bg-red-900/60 text-red-200 border border-red-500/70'
        }
        const statusLabels = {
          'ACTIVE': 'Aktivní',
          'INACTIVE': 'Neaktivní',
          'ARCHIVED': 'Archivovaný',
          'SUSPENDED': 'Pozastavený'
        }
        const color = statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
        const label = statusLabels[value as keyof typeof statusLabels] || value
        return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${color}`}>{label}</span>
      }
      
      if (field.id === 'priority') {
        const priorityColors = {
          'CRITICAL': 'bg-red-900/60 text-red-200 border border-red-500/70',
          'HIGH': 'bg-orange-900/60 text-orange-200 border border-orange-500/70',
          'MEDIUM': 'bg-amber-900/60 text-amber-200 border border-amber-500/70',
          'LOW': 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/70'
        }
        const priorityLabels = {
          'CRITICAL': 'Kritický',
          'HIGH': 'Vysoká',
          'MEDIUM': 'Střední',
          'LOW': 'Nízká'
        }
        const color = priorityColors[value as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'
        const label = priorityLabels[value as keyof typeof priorityLabels] || value
        return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${color}`}>{label}</span>
      }
      
      return value

    case 'string':
      if (field.id === 'jiraKey' && value) {
        return (
          <a 
            href={`https://itmancz.atlassian.net/browse/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 hover:underline"
          >
            {value}
          </a>
        )
      }
      return value

    default:
      return value
  }
}

function renderField(field: MetaField, data: any): React.ReactNode {
  if (field.type === 'group') {
    return (
      <div key={field.id} className="mb-8">
        <h3 className="text-lg font-semibold text-slate-50 mb-4 pb-2 border-b border-slate-700">
          {field.label}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field.fields?.map(subField => (
            <div key={subField.id} className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-slate-300">
                {subField.label}
              </span>
              <span className="text-sm text-slate-50 text-right">
                {renderFieldValue(subField, data[subField.id])}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div key={field.id} className="flex justify-between items-center py-2">
      <span className="text-sm font-medium text-slate-300">
        {field.label}
      </span>
      <span className="text-sm text-slate-50 text-right">
        {renderFieldValue(field, data[field.id])}
      </span>
    </div>
  )
}

export default function MetaDetail({ meta, data }: MetaDetailProps) {
  return (
    <div className="bg-slate-900/70 rounded-lg shadow-soft border border-slate-700 p-6">
      {meta.fields.map(field => renderField(field, data))}
    </div>
  )
}
