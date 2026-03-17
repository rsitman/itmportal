import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { fetchPatchModulesByCompany } from '@/lib/karat-service'
import PrehledPatchModulu from '@/components/patch-modules/PrehledPatchModulu'

export const metadata: Metadata = {
  title: 'Patch moduly',
  description: 'Přehled patch modulů projektu a firmy',
}

type PatchModulesPageProps = {
  searchParams: Promise<{ projekt?: string; firma?: string; returnTo?: string }>
}

export default async function PatchModulesPage({ searchParams }: PatchModulesPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const params = await searchParams
  const projekt = params.projekt?.trim() ?? ''
  const firma = params.firma?.trim() ?? ''
  const returnTo = params.returnTo?.trim() ?? null
  const missingParams = !projekt || !firma

  let patchModules: Awaited<ReturnType<typeof fetchPatchModulesByCompany>> = []
  if (!missingParams) {
    patchModules = await fetchPatchModulesByCompany(projekt, firma)
  }

  return (
    <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
      <div className="space-y-6">
        <PrehledPatchModulu
          patchModules={patchModules}
          projekt={projekt}
          firma={firma}
          returnTo={returnTo}
          missingParams={missingParams}
        />
      </div>
    </div>
  )
}
