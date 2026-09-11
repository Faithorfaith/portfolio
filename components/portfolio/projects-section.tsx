'use client'

import { playFeedback } from '@/lib/interaction-feedback'
import { normalizeExternalUrl } from '@/lib/content-utils'

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

  const featured = recentProjects[0]

  return (
      <section id="projects" className="portfolio-deferred w-full max-w-4xl mx-auto px-5 sm:px-8 py-16 md:py-24 scroll-mt-20">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/40">Selected work</p>
          <h2 className="mt-3 text-xl font-medium tracking-tight text-foreground">Projects I&apos;ve built</h2>
        </div>
        <span className="hidden text-[11px] text-foreground/40 sm:block">{recentProjects.length} projects</span>
      </div>

      {featured && (
        <a href={featured.link ? normalizeExternalUrl(featured.link) || undefined : undefined} target={featured.link ? '_blank' : undefined} rel={featured.link ? 'noopener noreferrer' : undefined} onClick={() => featured.link && playFeedback('tap')} className="group mb-14 block rounded-3xl bg-foreground/[0.045] p-6 transition-colors hover:bg-foreground/[0.075] sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div><p className="text-[10px] uppercase tracking-[0.16em] text-foreground/40">Latest project</p><h3 className="mt-3 text-2xl font-medium tracking-tight text-foreground">{featured.title}</h3></div>
            {featured.link && <span className="grid size-9 place-items-center rounded-full bg-background text-sm transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>}
          </div>
          {featured.description && <p className="mt-5 max-w-2xl text-sm leading-relaxed text-foreground/60">{featured.description}</p>}
          <div className="mt-8 flex flex-wrap gap-2 text-[11px] text-foreground/45"><span>{featured.year}</span>{featured.type && <><span>·</span><span>{featured.type}</span></>}</div>
        </a>
      )}

      <div className="space-y-12">
        {Object.entries(projectsByYear)
          .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
          .map(([year, items]) => (
          <section key={year} className="grid grid-cols-[48px_1fr] gap-4 sm:grid-cols-[64px_1fr] sm:gap-6">
            <h3 className="pt-4 text-[11px] tabular-nums text-foreground/38">{year}</h3>
            <div className="divide-y divide-foreground/10">
              {[...items]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .filter((project) => project.id !== featured?.id)
                .map((project) => (
                <a
                  key={project.id}
                  href={project.link ? normalizeExternalUrl(project.link) || undefined : undefined}
                  target={project.link ? '_blank' : undefined}
                  rel={project.link ? 'noopener noreferrer' : undefined}
                  onClick={() => {
                    if (project.link) {
                      playFeedback('tap')
                    }
                  }}
                  className={`group relative block w-full rounded-xl px-3 py-4 text-left transition-colors hover:bg-foreground/[0.04] ${project.link ? 'cursor-pointer' : ''}`}
                >
                    <div className="flex items-start justify-between gap-5">
                    {/* Left - Title & Description */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium leading-relaxed tracking-[0.01em] text-foreground/85 group-hover:text-foreground">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground/55">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {project.type && (
                      <span className="hidden sm:inline text-foreground/60 text-[11px] whitespace-nowrap shrink-0 transition-colors duration-200 group-hover:text-foreground/80">
                        {project.type}
                      </span>
                      )}
                      {project.link && <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-foreground/[0.05] text-foreground/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>}
                    </div>
                  </div>
                </a>
                ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
