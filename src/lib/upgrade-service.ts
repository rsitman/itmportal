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
        return 'text-green-600 bg-green-100'
      case 'v přípravě':
        return 'text-yellow-600 bg-yellow-100'
      case 'plánováno':
        return 'text-blue-600 bg-blue-100'
      case 'pozastaveno':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }
}
