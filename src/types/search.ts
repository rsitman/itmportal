export type SearchResultType = 'project' | 'news' | 'patch' | 'upgrade' | 'database' | 'person'

export type SearchResultItem = {
  type: SearchResultType
  id: string
  title: string
  subtitle?: string
  snippet?: string
  url: string
  metadata?: Record<string, unknown>
}

export type PersonOrigin = 'itman' | 'erp' | 'mixed'

export type PersonSource = 'itman' | 'erp_patch' | 'erp_upgrade' | 'erp_project_team'

export type PersonSearchResult = SearchResultItem & {
  type: 'person'
  id: string
  personKey: string
  origin: PersonOrigin
  sources: PersonSource[]
  fullName: string
  firstName?: string
  lastName?: string
  primaryEmail?: string
  roles?: string[]
  teamOrDepartment?: string
  primaryUrl: string
  contextSnippet?: string
}
