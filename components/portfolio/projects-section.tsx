'use client'

import { playFeedback } from '@/lib/interaction-feedback'

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
  const projectsByYear = recentProjects.reduce<Record<string, Project[]>>((groups, project) => {
    const year = project.year || new Date(project.created_at).getFullYear().toString()
    ;(groups[year] ||= []).push(project)
    return groups
  }, {})

  return (
      <div className="w-full max-w-2xl mx-auto px-8 py-12 md:py-12">
      <h2 className="text-foreground mb-8">Projects I&apos;ve built</h2>

      <div className="space-y-10">
        {Object.entries(projectsByYear)
          .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
          .map(([year, items]) => (
          <section key={year} className="grid grid-cols-[52px_1fr] md:grid-cols-[72px_1fr] gap-4 md:gap-6">
            <h3 className="text-[11px] text-foreground/38 pt-3 tabular-nums sticky top-6 self-start">{year}</h3>
            <div className="relative before:absolute before:left-[3px] before:top-5 before:bottom-5 before:w-px before:bg-foreground/10">
              {[...items]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    if (project.link) {
                      playFeedback('tap')
                      // Both mobile and desktop: open link directly
                      window.open(project.link, '_blank')
                    }
                  }}
                  className={`interactive-row relative w-full text-left group pl-6 ${project.link ? 'cursor-pointer' : ''}`}
                >
                    <span className="absolute left-0 top-[21px] size-[7px] rounded-full bg-background border border-foreground/25 transition-colors group-hover:bg-foreground group-hover:border-foreground" aria-hidden="true" />
                    <div className="flex items-start justify-between gap-6 py-3">
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
                      {project.type && (
                      <span className="text-foreground/40 text-[11px] whitespace-nowrap shrink-0 transition-colors duration-200 group-hover:text-foreground/60">
                        {project.type}
                      </span>
                      )}
                    </div>
                  </div>
                </button>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
