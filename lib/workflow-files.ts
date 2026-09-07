export interface WorkflowFileVersion {
  id: string
  workflow_file_id: string
  version_number: number
  file_name: string
  file_url: string
  notes: string | null
  created_at: string
}

export interface WorkflowFile {
  id: string
  name: string
  description: string | null
  published: boolean
  created_at: string
  updated_at: string
  workflow_file_versions: WorkflowFileVersion[]
}
