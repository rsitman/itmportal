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
    return <span className="text-gray-400">—</span>
  }

  switch (field.type) {
    case 'date':
      return formatDate(value)

    case 'boolean':
      return (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Ano' : 'Ne'}
        </span>
      )

    case 'enum':
      if (field.id === 'status') {
        const statusColors = {
          'ACTIVE': 'bg-green-100 text-green-800',
          'INACTIVE': 'bg-gray-100 text-gray-800',
          'ARCHIVED': 'bg-yellow-100 text-yellow-800',
          'SUSPENDED': 'bg-red-100 text-red-800'
        }
        const statusLabels = {
          'ACTIVE': 'Aktivní',
          'INACTIVE': 'Neaktivní',
          'ARCHIVED': 'Archivovaný',
          'SUSPENDED': 'Pozastavený'
        }
        const color = statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
        const label = statusLabels[value as keyof typeof statusLabels] || value
        return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{label}</span>
      }
      
      if (field.id === 'priority') {
        const priorityColors = {
          'CRITICAL': 'bg-red-100 text-red-800',
          'HIGH': 'bg-orange-100 text-orange-800',
          'MEDIUM': 'bg-yellow-100 text-yellow-800',
          'LOW': 'bg-green-100 text-green-800'
        }
        const priorityLabels = {
          'CRITICAL': 'Kritický',
          'HIGH': 'Vysoká',
          'MEDIUM': 'Střední',
          'LOW': 'Nízká'
        }
        const color = priorityColors[value as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'
        const label = priorityLabels[value as keyof typeof priorityLabels] || value
        return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{label}</span>
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
        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
          {field.label}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field.fields?.map(subField => (
            <div key={subField.id} className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-600">
                {subField.label}
              </span>
              <span className="text-sm text-gray-900 text-right">
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
      <span className="text-sm font-medium text-gray-600">
        {field.label}
      </span>
      <span className="text-sm text-gray-900 text-right">
        {renderFieldValue(field, data[field.id])}
      </span>
    </div>
  )
}

export default function MetaDetail({ meta, data }: MetaDetailProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      {meta.fields.map(field => renderField(field, data))}
    </div>
  )
}
