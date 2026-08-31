import { Suspense } from 'react'
import ProjectClient from './project-client'

export default function ProjectPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-foreground/50">Loading...</div>
      </div>
    }>
      <ProjectClient />
    </Suspense>
  )
}
