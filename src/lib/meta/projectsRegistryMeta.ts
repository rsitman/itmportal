import { MetaResource } from '@/types/meta'

export const projectsRegistryMeta: MetaResource = {
  id: 'projects-registry',
  label: 'Evidence projektů',
  fields: [
    {
      id: 'projectName',
      label: 'Projekt',
      type: 'string',
      optional: false
    },
    {
      id: 'projectId',
      label: 'ID Projektu',
      type: 'string',
      optional: false
    },
    {
      id: 'companyName',
      label: 'Firma',
      type: 'string',
      optional: false
    },
    {
      id: 'companyId',
      label: 'ID Firmy',
      type: 'string',
      optional: false
    },
    {
      id: 'status',
      label: 'Status',
      type: 'enum',
      optional: false,
      enumValues: ['ACTIVE', 'INACTIVE', 'ARCHIVED', 'SUSPENDED']
    },
    {
      id: 'priority',
      label: 'Priorita',
      type: 'enum',
      optional: false,
      enumValues: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    {
      id: 'accountManager',
      label: 'Správce',
      type: 'string',
      optional: true
    },
    {
      id: 'country',
      label: 'Stát',
      type: 'string',
      optional: false
    },
    {
      id: 'version',
      label: 'Verze',
      type: 'string',
      optional: false
    },
    {
      id: 'startDate',
      label: 'Začátek',
      type: 'date',
      optional: false
    },
    {
      id: 'endDate',
      label: 'Konec',
      type: 'date',
      optional: true
    },
    {
      id: 'hasPayrollModule',
      label: 'PAM',
      type: 'boolean',
      optional: false
    },
    {
      id: 'hasServicePatch',
      label: 'Servis',
      type: 'boolean',
      optional: false
    },
    {
      id: 'hasNewPatch',
      label: 'Vše nasazeno',
      type: 'boolean',
      optional: false
    },
    {
      id: 'hasNewLegalPatch',
      label: 'Legislativa nasazena',
      type: 'boolean',
      optional: false
    },
    {
      id: 'lastInstalledPatchDate',
      label: 'Posl. instalace',
      type: 'date',
      optional: true
    },
    {
      id: 'nextPlannedPatchDate',
      label: 'Další instalace',
      type: 'date',
      optional: true
    },
    {
      id: 'jiraKey',
      label: 'Jira',
      type: 'string',
      optional: true
    },
    {
      id: 'createdAt',
      label: 'Vytvořeno',
      type: 'date',
      optional: false
    },
    {
      id: 'updatedAt',
      label: 'Aktualizováno',
      type: 'date',
      optional: false
    }
  ]
}
