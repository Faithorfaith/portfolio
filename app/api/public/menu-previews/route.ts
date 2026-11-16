import { NextResponse } from 'next/server'
import { getPublicCaseStudyCards, getPublicWorks, getPublicWritings } from '@/lib/public-portfolio-data'

export const revalidate = 300

export async function GET() {
  const [caseStudies, works, writings] = await Promise.all([
    getPublicCaseStudyCards(),
    getPublicWorks(),
    getPublicWritings(),
  ])

  const caseStudyPreviews = caseStudies.flatMap(study => (
    study.thumbnail_url ? [{ src: study.thumbnail_url, title: study.title }] : []
  )).slice(0, 2)

  const books = writings.slice(0, 2).map(({ title, cover_image }) => ({ title, cover: cover_image }))

  return NextResponse.json({
    caseStudies: caseStudyPreviews.map(({ src }) => src),
    caseStudyPreviews,
    playground: works.flatMap(work => {
      if (work.media_type?.startsWith('video')) return []
      const image = work.thumbnail_url || (work.media_type?.startsWith('image') ? work.media_url : null)
      return image ? [image] : []
    }).slice(0, 2),
    writing: books[0] ?? null,
    books,
  })
}
