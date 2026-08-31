'use client'

export interface Project {
  id: string
  title: string
  year: string
  type: string | null
  link: string | null
  description: string | null
  created_at: string
}

export default function ProjectsSection({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return null
  }

  // Group projects by year
  const projectsByYear = projects.reduce((acc, project) => {
    const year = project.year
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(project)
    return acc
  }, {} as Record<string, Project[]>)

  const sortedYears = Object.keys(projectsByYear)
    .sort((a, b) => Number(b) - Number(a))

  return (
      <div className="w-full max-w-2xl mx-auto px-8 py-12 md:py-12">
      <h2 className="text-foreground mb-12">Projects I&apos;ve Built</h2>

      {/* Projects by year */}
      {sortedYears.map((year) => (
        <div key={year} className="mb-12">
          {/* Year */}
          <p className="text-foreground/50 text-sm mb-8">
            {year}
          </p>

          {/* Projects for this year */}
          <div className="space-y-6">
            {projectsByYear[year].map((project) => {
              return (
                <button
                  key={project.id}
                  onClick={() => {
                    if (project.link) {
                      // Both mobile and desktop: open link directly
                      window.open(project.link, '_blank')
                    }
                  }}
                  className={`w-full text-left group ${project.link ? 'cursor-pointer' : ''}`}
                >
                    <div className="flex items-start justify-between gap-6 py-4 px-4 rounded-lg transition-colors duration-200 group-hover:bg-foreground/4" style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
                    {/* Left - Title & Description */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-foreground/70 font-normal group-hover:text-foreground transition-colors duration-200">
                        {project.title}
                      </h3>
                      {/* Description — expands on row hover */}
                      {project.description && (
                        <p className="text-foreground/55 leading-relaxed overflow-hidden max-h-0 mt-0 opacity-0 group-hover:max-h-20 group-hover:mt-1.5 group-hover:opacity-100 transition-all duration-300 ease-out">
                          {project.description}
                        </p>
                      )}
                    </div>

                    {/* Right - Type */}
                    {project.type && (
                      <span className="text-foreground/40 text-sm whitespace-nowrap shrink-0 transition-colors duration-200 group-hover:text-foreground/60">
                        {project.type}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
