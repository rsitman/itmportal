import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import KalenderClient from '@/components/calendar/KalenderClient'

export default async function KalenderPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const userRole = (session.user as any)?.role ?? ''
  const outlookAvailable = Boolean((session as any).accessToken)

  return <KalenderClient userRole={userRole} outlookAvailable={outlookAvailable} />
}
