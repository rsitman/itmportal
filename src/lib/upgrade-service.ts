import { Upgrade } from '@/types/upgrade'

export class UpgradeService {
  private static readonly BASE_URL = '/api/upgrades-proxy'

  // Získání všech aktivních upgradů přes CORS proxy
  static async getUpgrades(): Promise<any[]> {
    try {
      const response = await fetch(this.BASE_URL)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch upgrades: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      throw error
    }
  }

  // Seskupení upgradů podle projektu
  static groupUpgradesByProject(upgrades: Upgrade[]): { [key: string]: Upgrade[] } {
    return upgrades.reduce((groups, upgrade) => {
      const projekt = upgrade.projekt
      if (!groups[projekt]) {
        groups[projekt] = []
      }
      groups[projekt].push(upgrade)
      return groups
    }, {} as { [key: string]: Upgrade[] })
  }

  // Získání upgradů pro konkrétní projekt
  static async getUpgradesByProject(projectId: string): Promise<Upgrade[]> {
    try {
      const upgrades = await this.getUpgrades()
      return upgrades.filter((upgrade: Upgrade) => upgrade.projekt === projectId)
    } catch (error) {
      throw error
    }
  }

  // Formátování data
  static formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Zjištění stavu barvy
  static getStatusColor(stav: string): string {
    switch (stav.toLowerCase()) {
      case 'realizováno':
        return 'status-badge-realizovano'
      case 'v přípravě':
        return 'status-badge-v-priprave'
      case 'plánováno':
        return 'status-badge-planovano'
      case 'pozastaveno':
        return 'status-badge-pozastaveno'
      default:
        return 'bg-gray-700/70 text-gray-100 border border-gray-500'
    }
  }
}
