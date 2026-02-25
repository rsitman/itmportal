import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

console.log('=== NEXTAUTH ROUTE CALLED ===')
console.log('Auth options providers:', authOptions.providers?.length || 0)

const handler = NextAuth(authOptions)

console.log('=== NEXTAUTH HANDLER CREATED ===')

export { handler as GET, handler as POST }