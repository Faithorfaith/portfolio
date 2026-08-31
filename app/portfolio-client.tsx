'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import ScrollProgressBar from '@/components/portfolio/scroll-progress-bar'
import NumberedNav from '@/components/portfolio/numbered-nav'
import ProfileSection, { type Profile, type CaseStudy } from '@/components/portfolio/profile-section'
import ProjectsSection, { type Project } from '@/components/portfolio/projects-section'
import { useSlickElementScroll } from '@/hooks/use-slick-scroll'

const WorksGallery = dynamic(() => import('@/components/portfolio/works-gallery'))
const WritingSection = dynamic(() => import('@/components/portfolio/writing-section'))
type Tab = 'home' | 'ui-shots' | 'writing'

export default function PortfolioClient({ profile, caseStudies, projects }: {
  profile: Profile | null
  caseStudies: CaseStudy[]
  projects: Project[]
}) {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [isSubPage, setIsSubPage] = useState(false)
  const homeRef = useRef<HTMLDivElement>(null)
  const playgroundRef = useRef<HTMLDivElement>(null)
  const writingRef = useRef<HTMLDivElement>(null)
  const activeScrollRef = activeTab === 'home' ? homeRef : activeTab === 'ui-shots' ? playgroundRef : writingRef
  const handleTabChange = useCallback((tab: Tab) => { setActiveTab(tab); setIsSubPage(false) }, [])
  useSlickElementScroll(activeScrollRef, activeTab)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('article')) setActiveTab('writing')
  }, [])

  return (
    <main className="flex flex-col w-full h-screen bg-background">
      <ScrollProgressBar scrollRef={activeScrollRef} />
      {!isSubPage && <NumberedNav activeTab={activeTab} onTabChange={handleTabChange} />}
      <div className="flex-1 overflow-hidden md:pl-32">
        {activeTab === 'home' && <div ref={homeRef} className="slick-scroll-container h-full overflow-y-auto pb-20 md:pb-0"><ProfileSection profile={profile} caseStudies={caseStudies} /><ProjectsSection projects={projects} /></div>}
        {activeTab === 'ui-shots' && <div ref={playgroundRef} className="slick-scroll-container h-full overflow-y-auto pb-20 md:pb-0"><WorksGallery onSubPageChange={setIsSubPage} /></div>}
        {activeTab === 'writing' && <div ref={writingRef} className="slick-scroll-container h-full overflow-y-auto pb-20 md:pb-0"><WritingSection onSubPageChange={setIsSubPage} /></div>}
      </div>
    </main>
  )
}
