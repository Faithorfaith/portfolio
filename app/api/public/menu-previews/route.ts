import { NextResponse } from 'next/server'
import { getPublicCaseStudyCards, getPublicWorks, getPublicWritings } from '@/lib/public-portfolio-data'

export const revalidate = 300

export async function GET() {
  const [caseStudies, works, writings] = await Promise.all([
    getPublicCaseStudyCards(),
    getPublicWorks(),
    getPublicWritings(),
  ])

  return NextResponse.json({
    caseStudies: caseStudies.flatMap(study => study.thumbnail_url ? [study.thumbnail_url] : []).slice(0, 2),
    playground: works.flatMap(work => {
      if (work.media_type?.startsWith('video')) return []
      const image = work.thumbnail_url || (work.media_type?.startsWith('image') ? work.media_url : null)
      return image ? [image] : []
    }).slice(0, 2),
    writing: writings[0] ? { title: writings[0].title, cover: writings[0].cover_image } : null,
  })
}
