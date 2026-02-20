import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role, Permission } from '@/lib/permissions'
import { logger } from '@/lib/logger'

// Helper function to check if user is admin
async function isAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'ADMIN'
}

// GET /api/roles/[role]/permissions - Get permissions for specific role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { role } = await params
    const roleEnum = role as Role
    
    // Validate role
    if (!Object.values(Role).includes(roleEnum)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Get role permissions from database - check if table exists
    let rolePermissions: any[] = []
    try {
      rolePermissions = await (prisma as any).rolePermission.findMany({
        where: { role }
      })
    } catch (error) {
      logger.log('RolePermission table might not exist yet, using default permissions')
      // Fallback to default permissions if table doesn't exist
      rolePermissions = []
    }

    const permissions = rolePermissions.map((rp: any) => rp.permission as Permission)

    return NextResponse.json({ permissions })
  } catch (error) {
    logger.error('Error fetching role permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/roles/[role]/permissions - Add permission to role
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const role = resolvedParams.role as Role
    const body = await request.json()
    const { permission } = body

    // Validate role and permission
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (!Object.values(Permission).includes(permission)) {
      return NextResponse.json({ error: 'Invalid permission' }, { status: 400 })
    }

    // Check if permission already exists
    let existing = null
    try {
      existing = await (prisma as any).rolePermission.findUnique({
        where: {
          role_permission: {
            role,
            permission
          }
        }
      })
    } catch (error) {
      logger.log('RolePermission table might not exist yet')
      existing = null
    }

    if (existing) {
      return NextResponse.json({ error: 'Permission already exists' }, { status: 409 })
    }

    // Add permission to role
    let rolePermission = null
    try {
      rolePermission = await (prisma as any).rolePermission.create({
        data: {
          role,
          permission
        }
      })
    } catch (error) {
      logger.log('RolePermission table might not exist yet')
      return NextResponse.json({ error: 'RolePermission table not available' }, { status: 503 })
    }

    return NextResponse.json(rolePermission, { status: 201 })
  } catch (error) {
    logger.error('Error adding role permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/roles/[role]/permissions - Remove permission from role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const role = resolvedParams.role as Role
    const body = await request.json()
    const { permission } = body

    // Validate role and permission
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (!Object.values(Permission).includes(permission)) {
      return NextResponse.json({ error: 'Invalid permission' }, { status: 400 })
    }

    // Remove permission from role
    try {
      await (prisma as any).rolePermission.delete({
        where: {
          role_permission: {
            role,
            permission
          }
        }
      })
    } catch (error) {
      logger.log('RolePermission table might not exist yet')
      return NextResponse.json({ error: 'RolePermission table not available' }, { status: 503 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error removing role permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
