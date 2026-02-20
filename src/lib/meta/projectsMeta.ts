import { MetaResource } from '@/types/meta'

export const projectsMeta: MetaResource = {
  id: 'projects',
  label: 'Projekty IS KARAT',
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
      id: 'accountManager',
      label: 'Osoba PPS',
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
      id: 'hasPayrollModule',
      label: 'Mzdy',
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
      label: 'Nový patch',
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
      id: 'nextPlannedPatchDate',
      label: 'Plánovaný patch',
      type: 'date',
      optional: false
    },
    {
      id: 'actions',
      label: 'Akce',
      type: 'actions',
      optional: false
    },
    {
      id: 'lastInstalledPatchDate',
      label: 'Posl. instalace',
      type: 'date',
      optional: true
    },
    {
      id: 'jiraKey',
      label: 'Jira',
      type: 'string',
      optional: true
    }
  ]
}
