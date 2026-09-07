import ProfileSection from '@/components/portfolio/profile-section'
import ProjectsSection from '@/components/portfolio/projects-section'
import HomeWritingPreview from '@/components/portfolio/home-writing-preview'
import HomePlaygroundPreview from '@/components/portfolio/home-playground-preview'
import TrainFooter from '@/components/portfolio/train-footer'
import WorkflowFilesSection from '@/components/portfolio/workflow-files-section'
import { getHomepagePortfolioData } from '@/lib/public-portfolio-data'

export const revalidate = 300

export default async function PortfolioPage() {
  const data = await getHomepagePortfolioData()
  return <main className="w-full min-h-screen bg-background pb-20">
    <ProfileSection profile={data.profile} caseStudies={data.caseStudies} />
    <ProjectsSection projects={data.projects} />
    <HomeWritingPreview writings={data.writings} />
    <WorkflowFilesSection files={data.workflowFiles} compact />
    <HomePlaygroundPreview works={data.works} hiddenCount={data.hiddenWorkCount} />
    <TrainFooter musicUrl={data.profile?.train_music_url} previews={{
      work: data.caseStudies.slice(0, 4).map(item => ({ title: item.title, description: item.excerpt, image: item.thumbnail_url, href: `/case-studies/${item.slug || item.id}` })),
      playground: data.works.slice(0, 4).map(item => ({ title: item.title, description: item.description, image: item.thumbnail_url || item.media_url, href: `/playground?work=${item.id}` })),
      writing: data.writings.slice(0, 4).map(item => ({ title: item.title, description: item.excerpt, image: item.cover_image, href: `/writing/${item.slug}` })),
      workflow: data.workflowFiles.slice(0, 4).map(item => ({ title: item.name, description: item.description })),
    }} />
  </main>
}
