import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import DbSizeChartClient from '@/components/charts/DbSizeChartClient'

export const metadata: Metadata = {
  title: 'Velikost databází',
  description: 'Graf velikosti databází podle firem a dnů',
}

export default async function DbSizeChartPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="w-full py-10">
      <div className="mb-8 px-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
          Velikost databází
        </h1>
        <p className="text-lg text-gray-600">
          Vývoj velikosti databází podle firem v čase
        </p>
      </div>
      
      <DbSizeChartClient />
    </div>
  )
}
