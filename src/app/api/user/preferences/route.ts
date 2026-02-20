import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SessionPreference } from '@prisma/client'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        rememberLogin: true,
        sessionPreference: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      rememberLogin: user.rememberLogin,
      sessionPreference: user.sessionPreference
    })
    
  } catch (error) {
    logger.error('Error getting user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rememberLogin, sessionPreference } = body

    // Validate sessionPreference
    if (sessionPreference && !Object.values(SessionPreference).includes(sessionPreference)) {
      return NextResponse.json(
        { error: 'Invalid sessionPreference value' },
        { status: 400 }
      )
    }

    // Validate rememberLogin
    if (typeof rememberLogin !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid rememberLogin value' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        rememberLogin,
        sessionPreference: sessionPreference || 'REMEMBER'
      },
      select: {
        rememberLogin: true,
        sessionPreference: true
      }
    })

    return NextResponse.json(updatedUser)
    
  } catch (error) {
    logger.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
