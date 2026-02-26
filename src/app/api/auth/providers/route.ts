import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('=== PROVIDERS DEBUG START ===')
    console.log('Raw authOptions.providers:', authOptions.providers)
    console.log('Providers length:', authOptions.providers.length)
    
    const providers = authOptions.providers.reduce((acc, provider) => {
      acc[provider.id] = {
        id: provider.id,
        name: provider.name,
        type: provider.type,
      }
      return acc
    }, {} as Record<string, { id: string; name: string; type: string }>)
    
    console.log('Mapped providers:', providers)
    console.log('=== PROVIDERS DEBUG END ===')

    return NextResponse.json(providers)
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
  }
}
