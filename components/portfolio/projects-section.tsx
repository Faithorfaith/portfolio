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

  const recentProjects = [...projects].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
      <div className="w-full max-w-2xl mx-auto px-8 py-12 md:py-12">
      <h2 className="text-foreground mb-8">Projects I&apos;ve built</h2>

      <div className="space-y-1">
        {recentProjects.map((project) => (
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
                    <div className="flex items-start justify-between gap-6 py-4">
                    {/* Left - Title & Description */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-foreground/70 font-normal group-hover:text-foreground transition-colors duration-200">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-foreground/45 leading-relaxed mt-1 line-clamp-1">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-foreground/35 text-sm whitespace-nowrap">{project.year}</span>
                      {project.type && (
                      <span className="text-foreground/40 text-sm whitespace-nowrap shrink-0 transition-colors duration-200 group-hover:text-foreground/60">
                        {project.type}
                      </span>
                      )}
                    </div>
                  </div>
                </button>
        ))}
      </div>
    </div>
  )
}
