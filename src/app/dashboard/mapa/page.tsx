import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import CompanyMapClient from '@/components/maps/CompanyMapClient'
import { hasPermission, Permission, Role } from '@/lib/permissions'

export default async function MapPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const userRole = (session.user?.role as Role) ?? Role.USER

  if (!hasPermission(userRole, Permission.MAP_VIEW)) {
    redirect('/dashboard?error=access_denied')
  }

  return (
    <div className="min-h-screen bg-transparent">
      <CompanyMapClient />
    </div>
  )
}
