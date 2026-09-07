import WorkflowFilesSection from '@/components/portfolio/workflow-files-section'
import { DetailNavigation } from '@/components/detail-page-header'
import { getPublicWorkflowFiles } from '@/lib/public-portfolio-data'

export const revalidate = 60
export const metadata = { title: 'Workflow files — Faith Awokunle', description: 'Reusable AGENTS.md files and workflow tools.' }

export default async function WorkflowsPage() {
  const files = await getPublicWorkflowFiles()
  return <main className="min-h-screen"><DetailNavigation title="Workflow files" backHref="/"/><div className="pt-20"><WorkflowFilesSection files={files}/></div></main>
}
