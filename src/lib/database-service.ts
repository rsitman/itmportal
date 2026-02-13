import { Database } from '@/types/database'

export class DatabaseService {
  static formatDate(dateString: string): string {
    if (!dateString) return '—'
    
    try {
      const date = new Date(dateString)
      return date.toLocaleString('cs-CZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  static formatSize(sizeMB: number): string {
    if (sizeMB >= 1000) {
      return `${(sizeMB / 1024).toFixed(1)} GB`
    }
    return `${sizeMB} MB`
  }

  static getUsageColor(percentage: number): string {
    if (percentage >= 90) return 'bg-red-100 text-red-800'
    if (percentage >= 75) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  static getLogUsageColor(percentage: number): string {
    if (percentage >= 95) return 'bg-red-100 text-red-800'
    if (percentage >= 80) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  static getDaysRemainingColor(days: number): string {
    if (days <= 30) return 'bg-red-100 text-red-800'
    if (days <= 90) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  static calculateUsagePercentage(used: number, max: number): number {
    if (max === 0) return 0
    return Math.round((used / max) * 100)
  }
}
