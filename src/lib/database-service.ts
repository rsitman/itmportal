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
    if (percentage >= 90) return 'bg-red-500/20 text-red-400 border border-red-500/30'
    if (percentage >= 75) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    return 'bg-green-500/20 text-green-400 border border-green-500/30'
  }

  static getLogUsageColor(percentage: number): string {
    if (percentage >= 95) return 'bg-red-500/20 text-red-400 border border-red-500/30'
    if (percentage >= 80) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    return 'bg-green-500/20 text-green-400 border border-green-500/30'
  }

  static getDaysRemainingColor(days: number): string {
    if (days <= 30) return 'bg-red-500/20 text-red-400 border border-red-500/30'
    if (days <= 90) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    return 'bg-green-500/20 text-green-400 border border-green-500/30'
  }

  static calculateUsagePercentage(used: number, max: number): number {
    if (max === 0) return 0
    return Math.round((used / max) * 100)
  }
}
