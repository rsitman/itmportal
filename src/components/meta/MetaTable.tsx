'use client'

import { MetaResource, MetaField } from '@/types/meta'
import { logger } from '@/lib/logger'

interface MetaTableProps {
  meta: MetaResource
  rows: any[]
}

function formatDate(dateInput: any): string {
  if (!dateInput) return '—'
  
  if (typeof dateInput === 'string') {
    const parsedDate = new Date(dateInput)
    if (isNaN(parsedDate.getTime())) return '—'
    return parsedDate.toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '—'
    return dateInput.toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  
  return '—'
}

function StatusBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        enabled
          ? 'bg-green-900/50 text-green-200 border border-green-800'
          : 'bg-red-900/50 text-red-200 border border-red-800'
      }`}
    >
      {enabled ? '✓' : '✗'} {label}
    </span>
  )
}

function renderCellValue(field: MetaField, value: any, row: any): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  switch (field.type) {
    case 'string':
      // Special handling for Jira keys to create links
      if (field.id === 'jiraKey' && value) {
        return (
          <a
            href={`https://itmancz.atlassian.net/browse/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 text-sm font-medium"
            style={{ color: '#34d399' }}
          >
            {value}
          </a>
        )
      }
      return value

    case 'number':
      return typeof value === 'number' ? value.toLocaleString('cs-CZ') : value

    case 'date':
      return formatDate(value)

    case 'boolean':
      // Special handling for boolean fields that should show as badges
      if (field.id.startsWith('has')) {
        let label = field.label.replace('PAM', 'PAM')
          .replace('Servis', 'Servis')
          .replace('Vše nasazeno', 'Vše')
          .replace('Legislativa nasazena', 'Legislativa')
        
        // For patches that need to be installed, reverse the logic
        // hasNewPatch=true and hasNewLegalPatch=true means NEEDS to be installed (red)
        const enabled = (field.id === 'hasNewLegalPatch' || field.id === 'hasNewPatch') ? !value : value
        
        return <StatusBadge enabled={enabled} label={label} />
      }
      return value ? 'Ano' : 'Ne'

    case 'actions':
      logger.log('renderCellValue - actions case, row:', row.projectId)
      return (
        <button
          onClick={() => {
            const url = `/patch-modules?projekt=${encodeURIComponent(row.projectId)}&firma=${encodeURIComponent(row.companyId)}`
            window.location.href = url
          }}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Detail
        </button>
      )

    case 'enum':
      // Special handling for status and priority enums
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

    default:
      return value
  }
}

function renderCellContent(field: MetaField, row: any): React.ReactNode {
  // Debug logging pro actions pole
  if (field.id === 'actions') {
    logger.log('renderCellContent called for actions field, row:', row.projectId)
  }
  
  // Handle actions field - always render regardless of data
  if (field.id === 'actions') {
    logger.log('Handling actions field directly')
    return renderCellValue(field, 'actions', row)
  }
  
  // Handle compound fields like projectName + projectId
  if (field.id === 'projectName') {
    return (
      <div>
        <div className="text-sm font-medium text-white">
          <a 
            href={`/plan_patchovani/${row.companyId}`}
            className="hover:text-green-300 hover:underline cursor-pointer"
            style={{ color: '#34d399' }}
            onClick={(e) => {
              e.preventDefault()
              window.location.href = `/plan_patchovani/${row.companyId}`
            }}
          >
            {row.projectName || '—'}
          </a>
        </div>
        <div className="text-sm text-gray-400">
          {row.projectId || '—'}
        </div>
      </div>
    )
  }

  // Handle compound fields like companyName + companyId
  if (field.id === 'companyName') {
    return (
      <div>
        <div className="text-sm font-medium text-white">
          <a 
            href={`/plan_patchovani/${row.companyId}`}
            className="hover:text-green-300 hover:underline cursor-pointer"
            style={{ color: '#34d399' }}
            onClick={(e) => {
              e.preventDefault()
              window.location.href = `/plan_patchovani/${row.companyId}`
            }}
          >
            {row.companyName || '—'}
          </a>
        </div>
        <div className="text-sm text-gray-400">
          {row.companyId || '—'}
        </div>
      </div>
    )
  }

  return renderCellValue(field, row[field.id], row)
}

export default function MetaTable({ meta, rows }: MetaTableProps) {
  // Filter out compound fields that are handled specially
  const visibleFields = meta.fields.filter(field => 
    !['projectId', 'companyId'].includes(field.id)
  )
  
  // Debug logging
  logger.log('MetaTable - All fields:', meta.fields.map(f => ({ id: f.id, label: f.label, type: f.type })))
  logger.log('MetaTable - Visible fields:', visibleFields.map(f => ({ id: f.id, label: f.label, type: f.type })))
  logger.log('MetaTable - Sample row data:', rows[0])

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1200px]">
        <table className="w-full border-collapse divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              {visibleFields.map((field) => (
                <th
                  key={field.id}
                  scope="col"
                  className={`px-6 py-3 text-xs font-medium text-gray-300 uppercase tracking-wide border-b border-gray-700 ${
                    ['accountManager', 'version'].includes(field.id)
                      ? 'w-24 text-center'
                      : field.id === 'country'
                      ? 'w-20 text-center'
                      : ['hasPayrollModule', 'hasServicePatch', 'hasNewPatch', 'hasNewLegalPatch'].includes(field.id)
                      ? 'w-16 text-center'
                      : ['status', 'priority'].includes(field.id)
                      ? 'w-20 text-center'
                      : ['nextPlannedPatchDate', 'lastInstalledPatchDate', 'startDate', 'endDate', 'createdAt', 'updatedAt'].includes(field.id)
                      ? 'w-28 text-center'
                      : field.id === 'jiraKey'
                      ? 'w-24 text-center'
                      : ''
                  }`}
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {rows.map((row, index) => (
              <tr key={`${row.projectId}-${index}`} className="hover:bg-gray-800">
                {visibleFields.map((field) => (
                  <td
                    key={field.id}
                    className={`px-6 py-4 text-sm text-white border-b border-gray-700 ${
                      ['accountManager', 'version'].includes(field.id)
                        ? 'text-center'
                        : field.id === 'country'
                        ? 'text-center'
                        : ['hasPayrollModule', 'hasServicePatch', 'hasNewPatch', 'hasNewLegalPatch'].includes(field.id)
                        ? 'text-center'
                        : ['status', 'priority'].includes(field.id)
                        ? 'text-center'
                        : ['nextPlannedPatchDate', 'lastInstalledPatchDate', 'startDate', 'endDate', 'createdAt', 'updatedAt'].includes(field.id)
                        ? 'text-center'
                        : field.id === 'jiraKey'
                        ? 'text-center'
                        : ''
                    }`}
                  >
                    {renderCellContent(field, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
