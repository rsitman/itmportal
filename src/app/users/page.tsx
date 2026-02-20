import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import UsersClient from '@/components/UsersClient'
import { logger } from '@/lib/logger'

async function getUsers() {
  try {
    const headersList = await headers()
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/users`, {
      cache: 'no-store',
      headers: {
        'Cookie': headersList.get('cookie') || '',
      },
    })

    if (!response.ok) {
      logger.error('Failed to fetch users:', response.status)
      return []
    }

    return await response.json()
  } catch (error) {
    logger.error('Error fetching users:', error)
    return []
  }
}

export default async function UsersPage() {
  // Check if user is authenticated and has ADMIN role
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }
  
  // Pokud je uživatel přihlášen přes Azure AD, přesměrujeme na dashboard
  // Azure AD uživatelé mají typicky email z domény, lokální uživatelé ne
  if (session.user.email?.includes('@itman.cz')) {
    redirect('/dashboard?error=azure_ad_users_restricted')
  }
  
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard?error=access_denied')
  }

  const users = await getUsers()
  
  return (
    <div className="w-full py-10 bg-transparent">
      <div className="mb-8 px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Uživatelé
        </h1>
        <p className="text-lg text-gray-300">
          Správa uživatelských účtů a oprávnění
        </p>
        {session.user.email && !session.user.email.includes('@itman.cz') && (
          <div className="mt-4 p-4 bg-blue-900/50 border border-green-800 rounded-lg">
            <p className="text-sm text-green-200">
              <strong className="text-green-100">Lokální administrátor:</strong> Jste přihlášen přes lokální účet s administrátorskými právy.
            </p>
          </div>
        )}
      </div>
      
      <UsersClient users={users} />
    </div>
  )
}
