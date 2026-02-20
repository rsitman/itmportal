import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'

// Helper function to check if user is admin
async function isAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'ADMIN'
}

// GET /api/users/[id] - Get single user (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    logger.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/users/[id] - Update user (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        authProvider: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { role, isActive, password, name } = body
    const updateData: any = {}

    // Handle role update (allowed for all providers)
    if (role !== undefined && ['ADMIN', 'USER'].includes(role)) {
      updateData.role = role
    }

    // Handle status update (allowed for all providers)
    if (isActive !== undefined && typeof isActive === 'boolean') {
      updateData.isActive = isActive
    }

    // Handle name update (allowed for all providers)
    if (name !== undefined && typeof name === 'string') {
      updateData.name = name
    }

    // Handle password update (only for LOCAL accounts)
    if (password !== undefined) {
      if (user.authProvider === 'AZURE_AD') {
        return NextResponse.json({ 
          error: 'Password cannot be changed for Microsoft accounts. Please change password in Microsoft Azure.' 
        }, { status: 400 })
      }
      
      if (typeof password === 'string' && password.length >= 6) {
        const saltRounds = 12
        updateData.password = await bcrypt.hash(password, saltRounds)
      } else {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
      }
    }

    // Prevent changing auth provider and externalId
    if (body.authProvider !== undefined) {
      return NextResponse.json({ error: 'Authentication provider cannot be changed' }, { status: 400 })
    }

    if (body.externalId !== undefined) {
      return NextResponse.json({ error: 'External ID cannot be changed' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: resolvedParams.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    logger.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await getServerSession(authOptions)
    const resolvedParams = await params

    // Prevent self-deletion
    if (session?.user?.id === resolvedParams.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.user.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    logger.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
