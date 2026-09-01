'use client'

import dynamic from 'next/dynamic'
import ProfileSection, { type Profile, type CaseStudy } from '@/components/portfolio/profile-section'
import ProjectsSection, { type Project } from '@/components/portfolio/projects-section'

const WorksGallery = dynamic(() => import('@/components/portfolio/works-gallery'))
const WritingSection = dynamic(() => import('@/components/portfolio/writing-section'))

export default function PortfolioClient({ profile, caseStudies, projects }: {
  profile: Profile | null
  caseStudies: CaseStudy[]
  projects: Project[]
}) {
  return (
    <main className="w-full min-h-screen bg-background pb-20">
      <ProfileSection profile={profile} caseStudies={caseStudies} />
      <ProjectsSection projects={projects} />
      <WritingSection variant="home" />
      <WorksGallery variant="preview" />
    </main>
  )
}
