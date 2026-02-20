import { Database } from '@/types/database'

export class DatabaseServiceExtended {
  private static readonly BASE_URL = '/api/databases'

  // Získání všech databází
  static async getDatabases(): Promise<Database[]> {
    try {
      const response = await fetch(this.BASE_URL)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch databases: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data.databases
    } catch (error) {
      throw error
    }
  }

  // Seskupení databází podle firmy
  static groupDatabasesByCompany(databases: Database[]): { [key: string]: Database[] } {
    return databases.reduce((groups, database) => {
      const company = database.firma_nazev
      if (!groups[company]) {
        groups[company] = []
      }
      groups[company].push(database)
      return groups
    }, {} as { [key: string]: Database[] })
  }

  // Získání databází pro konkrétní firmu
  static async getDatabasesByCompany(companyName: string): Promise<Database[]> {
    try {
      const databases = await this.getDatabases()
      return databases.filter((database: Database) => database.firma_nazev === companyName)
    } catch (error) {
      throw error
    }
  }

  // Statistiky
  static getDatabaseStats(databases: Database[]) {
    const totalSize = databases.reduce((sum, db) => sum + db.velikost, 0)
    const totalMaxSize = databases.reduce((sum, db) => sum + db.velikost_max, 0)
    const criticalDatabases = databases.filter(db => {
      const usagePercentage = (db.velikost - db.velikost_volne) / db.velikost_max * 100
      return usagePercentage >= 90
    })
    const lowSpaceDatabases = databases.filter(db => db.volne_zbyva_dni <= 90)

    return {
      totalDatabases: databases.length,
      totalSize,
      totalMaxSize,
      usagePercentage: totalMaxSize > 0 ? Math.round((totalSize / totalMaxSize) * 100) : 0,
      criticalDatabases: criticalDatabases.length,
      lowSpaceDatabases: lowSpaceDatabases.length
    }
  }
}
