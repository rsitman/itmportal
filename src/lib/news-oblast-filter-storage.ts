const STORAGE_KEY_PREFIX = 'aktualityOblastFilter'

export function getNewsOblastFilterStorageKey(userKey: string): string {
  return `${STORAGE_KEY_PREFIX}:${userKey}`
}

export function loadNewsOblastFilter(userKey: string): string[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(getNewsOblastFilterStorageKey(userKey))
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return [
      ...new Set(
        parsed
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ]
  } catch {
    return []
  }
}

export function saveNewsOblastFilter(userKey: string, oblasti: string[]): void {
  if (typeof window === 'undefined') return

  try {
    const key = getNewsOblastFilterStorageKey(userKey)
    const normalized = [
      ...new Set(oblasti.map((value) => value.trim()).filter(Boolean)),
    ]

    if (normalized.length === 0) {
      window.localStorage.removeItem(key)
      return
    }

    window.localStorage.setItem(key, JSON.stringify(normalized))
  } catch {
    // Ignore quota / private mode errors.
  }
}
