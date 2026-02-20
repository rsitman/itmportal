export const dynamic = 'force-dynamic'
import { KaratProject } from '@/lib/karat'
import { fetchKaratProjectsDirect } from '@/lib/karat-service'
import ProjectsClient from '@/components/ProjectsClient'

export default async function ProjectsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string }>
}) {
  const projects = await fetchKaratProjectsDirect()
  console.log('PAGE: fetched projects count:', projects.length)
  const resolvedSearchParams = await searchParams
  
  // Filter projects by company name if query parameter is provided
  const filteredProjects = resolvedSearchParams.q 
    ? projects.filter(project => 
        project.companyName.toLowerCase().includes(resolvedSearchParams.q!.toLowerCase())
      )
    : projects
  
  // Serialize Date objects for client component
  const serializedProjects = filteredProjects.map(p => ({
    ...p,
    lastInstalledPatchDate: p.lastInstalledPatchDate?.toISOString() ?? null,
    nextPlannedPatchDate: p.nextPlannedPatchDate?.toISOString() ?? null,
    lastUpdateDate: p.lastUpdateDate?.toISOString() ?? null,
  }))

  return (
    <div className="w-full py-10 bg-transparent">
      <div className="mb-8 px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Přehled patchování
        </h1>
        <p className="text-lg text-gray-300">
          {resolvedSearchParams.q 
            ? `Aktuální stav klientů pro firmu: ${resolvedSearchParams.q} (${filteredProjects.length} projektů)`
            : `Aktuální stav ${filteredProjects.length} klientů`
          }
        </p>
      </div>
      
      <ProjectsClient 
        projects={serializedProjects as any} 
      />
    </div>
  )
}
