import { headers } from 'next/headers'
import { KaratProject } from '@/lib/karat'
import ProjectsClient from '@/components/ProjectsClient'

async function getKaratProjects(): Promise<KaratProject[]> {
  try {
    const headersList = await headers()  // ✅ AWAIT!
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/karat/projects`, {
      cache: 'no-store',
      headers: {
        'Cookie': headersList.get('cookie') || '',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch KARAT projects:', response.status)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching KARAT projects:', error)
    return []
  }
}

export default async function ProjectsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string }>  // ✅ Promise!
}) {
  console.log('🔄 Plan patchovani page loaded')
  const projects = await getKaratProjects()
  console.log('📊 Fetched projects:', projects.length)
  const resolvedSearchParams = await searchParams  // ✅ AWAIT!
  console.log('🔍 Search params:', resolvedSearchParams)
  
  // Filter projects by company name if query parameter is provided
  const filteredProjects = resolvedSearchParams.q 
    ? projects.filter(project => 
        project.companyName.toLowerCase().includes(resolvedSearchParams.q!.toLowerCase())
      )
    : projects
  
  console.log('📊 Filtered projects:', filteredProjects.length)
  
  return (
    <div className="w-full py-10">
      <div className="mb-8 px-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
          Přehled patchování
        </h1>
        <p className="text-lg text-gray-600">
          {resolvedSearchParams.q 
            ? `Aktuální stav klientů pro firmu: ${resolvedSearchParams.q} (${filteredProjects.length} projektů)`
            : `Aktuální stav ${filteredProjects.length} klientů`
          }
        </p>
      </div>
      
      <ProjectsClient 
        projects={filteredProjects} 
      />
    </div>
  )
}
