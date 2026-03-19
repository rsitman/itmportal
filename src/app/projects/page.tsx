'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProjectsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/evidence-projektu')
  }, [router])

  return (
    <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">Evidence projektů</h1>
        <p className="text-sm text-gray-400">Přesměrování z legacy trasy „/projects“…</p>
      </div>
    </div>
  )
}
