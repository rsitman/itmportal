import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const providers = authOptions.providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      type: provider.type
    }))

    return NextResponse.json(providers)
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
  }
}
