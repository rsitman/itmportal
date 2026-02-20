export interface Upgrade {
  projekt: string
  nazev: string
  verze: string
  datum_od: string
  datum_do: string
  resitel: string
  jira_klic: string
  stav: string
}

export interface UpgradeProject {
  projekt: string
  nazev: string
  upgrades: Upgrade[]
}
