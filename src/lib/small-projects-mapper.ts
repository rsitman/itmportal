import { SmallProject, SmallProjectSubTask } from '@/types/project'

type RawSmallProjectSubTask = Partial<Record<keyof SmallProjectSubTask, unknown>>
type RawSmallProject = Partial<Record<keyof SmallProject, unknown>> & {
  sub_tasks?: unknown
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function toNumberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function mapSubTasks(rawSubTasks: unknown): SmallProjectSubTask[] {
  if (!Array.isArray(rawSubTasks)) {
    return []
  }

  return rawSubTasks.map((item) => {
    const subTask = item as RawSmallProjectSubTask

    return {
      jira_klic_sub: toStringValue(subTask.jira_klic_sub),
      nazev_sub: toStringValue(subTask.nazev_sub),
      vyr_rozp: toNumberValue(subTask.vyr_rozp),
      hodin_odv: toNumberValue(subTask.hodin_odv),
      resitel: toStringValue(subTask.resitel),
      zadavatel: toStringValue(subTask.zadavatel),
      stav: toStringValue(subTask.stav),
    }
  })
}

export function mapSmallProjects(rawData: unknown): SmallProject[] {
  if (!Array.isArray(rawData)) {
    return []
  }

  return rawData.map((item) => {
    const project = item as RawSmallProject

    return {
      projekt: toStringValue(project.projekt),
      nazev_proj: toStringValue(project.nazev_proj),
      jira_klic: toStringValue(project.jira_klic),
      nazev_poz: toStringValue(project.nazev_poz),
      rozp: toNumberValue(project.rozp),
      hodin_odv: toNumberValue(project.hodin_odv),
      resitel: toStringValue(project.resitel),
      zadavatel: toStringValue(project.zadavatel),
      stav: toStringValue(project.stav),
      sub_tasks: mapSubTasks(project.sub_tasks),
    }
  })
}

export function getKaratFetchErrorResponseBody(error: unknown) {
  const cause =
    error instanceof Error && 'cause' in error
      ? (error.cause as { code?: string; hostname?: string } | undefined)
      : undefined
  const networkCodes = new Set(['EAI_AGAIN', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'])

  if (cause?.code && networkCodes.has(cause.code)) {
    const host = cause.hostname || 'itmsql01'
    return {
      status: 503,
      body: {
        error: 'karat_unreachable',
        message: `IS KARAT (${host}) není dostupný. Zkontrolujte připojení k VPN nebo firemní síti.`,
      },
    }
  }

  return {
    status: 500,
    body: { error: 'Failed to fetch small projects' },
  }
}
