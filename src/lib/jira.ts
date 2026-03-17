function normalizeBaseUrl(raw: string | undefined | null): string {
  const v = (raw ?? '').trim()
  if (!v) return 'https://itmancz.atlassian.net'
  return v.replace(/\/+$/, '')
}

export const JIRA_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_HELPDESK_URL)

export function jiraIssueUrl(issueKey: string): string {
  const key = (issueKey ?? '').trim()
  return `${JIRA_BASE_URL}/browse/${encodeURIComponent(key)}`
}

