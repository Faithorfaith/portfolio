'use client'

import dynamic from 'next/dynamic'
import ProfileSection, { type Profile, type CaseStudy } from '@/components/portfolio/profile-section'
import ProjectsSection, { type Project } from '@/components/portfolio/projects-section'
import PortfolioHeader from '@/components/portfolio/portfolio-header'
import type { Work } from '@/components/portfolio/works-gallery'
import type { Writing } from '@/components/portfolio/writing-section'

const WorksGallery = dynamic(() => import('@/components/portfolio/works-gallery'))
const WritingSection = dynamic(() => import('@/components/portfolio/writing-section'))

export default function PortfolioClient({ profile, caseStudies, projects, works, writings }: {
  profile: Profile | null
  caseStudies: CaseStudy[]
  projects: Project[]
  works: Work[]
  writings: Writing[]
}) {
  return (
    <main className="w-full min-h-screen bg-background pb-20 pt-[52px]">
      <PortfolioHeader />
      <ProfileSection profile={profile} caseStudies={caseStudies} />
      <ProjectsSection projects={projects} />
      <WritingSection variant="home" initialWritings={writings} />
      <WorksGallery variant="preview" initialWorks={works} />
    </main>
  )
}
