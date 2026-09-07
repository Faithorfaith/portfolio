import ProfileSection from '@/components/portfolio/profile-section'
import ProjectsSection from '@/components/portfolio/projects-section'
import HomeWritingPreview from '@/components/portfolio/home-writing-preview'
import HomePlaygroundPreview from '@/components/portfolio/home-playground-preview'
import { getHomepagePortfolioData } from '@/lib/public-portfolio-data'

export const revalidate = 300

export default async function PortfolioPage() {
  const data = await getHomepagePortfolioData()
  return <main className="w-full min-h-screen bg-background pb-20">
    <ProfileSection profile={data.profile} caseStudies={data.caseStudies} />
    <ProjectsSection projects={data.projects} />
    <HomeWritingPreview writings={data.writings} />
    <HomePlaygroundPreview works={data.works} hiddenCount={data.hiddenWorkCount} />
  </main>
}
