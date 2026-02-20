import { MetaResource } from '@/types/meta'

export const projectDetailMeta: MetaResource = {
  id: 'project-detail',
  label: 'Detail projektu',
  fields: [
    {
      id: 'projectInfo',
      label: 'Základní informace',
      type: 'group',
      optional: false,
      fields: [
        {
          id: 'projectName',
          label: 'Název projektu',
          type: 'string',
          optional: false
        },
        {
          id: 'projectId',
          label: 'ID projektu',
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
          label: 'ID firmy',
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
        }
      ]
    },
    {
      id: 'technicalInfo',
      label: 'Technické informace',
      type: 'group',
      optional: false,
      fields: [
        {
          id: 'version',
          label: 'Verze',
          type: 'string',
          optional: false
        },
        {
          id: 'country',
          label: 'Stát',
          type: 'string',
          optional: false
        },
        {
          id: 'accountManager',
          label: 'Správce projektu',
          type: 'string',
          optional: true
        },
        {
          id: 'jiraKey',
          label: 'Jira klíč',
          type: 'string',
          optional: true
        },
        {
          id: 'startDate',
          label: 'Datum zahájení',
          type: 'date',
          optional: false
        },
        {
          id: 'endDate',
          label: 'Datum ukončení',
          type: 'date',
          optional: true
        }
      ]
    },
    {
      id: 'patchManagement',
      label: 'Správa patchů',
      type: 'group',
      optional: false,
      fields: [
        {
          id: 'hasPayrollModule',
          label: 'PAM modul',
          type: 'boolean',
          optional: false
        },
        {
          id: 'hasServicePatch',
          label: 'Servisní patch',
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
          label: 'Poslední instalace',
          type: 'date',
          optional: true
        },
        {
          id: 'nextPlannedPatchDate',
          label: 'Další plánovaná instalace',
          type: 'date',
          optional: true
        }
      ]
    },
    {
      id: 'systemInfo',
      label: 'Systémové informace',
      type: 'group',
      optional: false,
      fields: [
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
        },
        {
          id: 'lastSyncAt',
          label: 'Poslední synchronizace',
          type: 'date',
          optional: true
        }
      ]
    }
  ]
}
