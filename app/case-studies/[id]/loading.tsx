export default function CaseStudyLoading() {
  return (
    <main className="case-story min-h-screen" aria-busy="true">
      <div className="case-story-hero case-story-opening case-story-loading" role="status">
        <span>Loading case study</span>
        <div className="case-story-cover" aria-hidden="true" />
      </div>
    </main>
  )
}
