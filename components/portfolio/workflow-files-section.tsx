'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { WorkflowFile } from '@/lib/workflow-files'

function FileGlyph() {
  return <span className="workflow-file-glyph" aria-hidden="true"><i>MD</i></span>
}

export default function WorkflowFilesSection({ files = [], compact = false }: { files?: WorkflowFile[]; compact?: boolean }) {
  const [active, setActive] = useState<WorkflowFile | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { if (active) dialog.current?.showModal() }, [active])
  if (!files.length) return null
  const visible = compact ? files.slice(0, 4) : files
  const close = () => { dialog.current?.close(); setActive(null) }
  return <section id="workflow-files" className="portfolio-deferred w-full max-w-2xl mx-auto px-5 sm:px-8 py-12" aria-labelledby="workflow-files-title">
    <div className="mb-8 flex items-baseline justify-between"><h2 id="workflow-files-title" className="text-sm font-normal tracking-[.01em]">Workflow files</h2>{compact && files.length > 4 && <Link href="/workflows" className="text-[11px] text-foreground/50 hover:text-foreground">View directory ↗</Link>}</div>
    <div className="workflow-file-list">{visible.map(file => {
      const latest = file.workflow_file_versions[0]
      return <button key={file.id} onClick={() => setActive(file)} className="workflow-file-row">
        <FileGlyph/><span><strong>{file.name}</strong><small>{file.description || 'Reusable workflow file'}</small></span><em>{latest ? `v${latest.version_number}` : 'No file'}</em>
      </button>
    })}</div>
    {active && <dialog ref={dialog} className="workflow-file-dialog" onCancel={close} onClick={e => e.target === e.currentTarget && close()}>
      <div><header><FileGlyph/><button onClick={close} aria-label="Close file preview">×</button></header><p className="text-[11px] text-foreground/45">Workflow file</p><h2>{active.name}</h2><p>{active.description}</p>
        {active.workflow_file_versions[0] && <a className="workflow-download" href={active.workflow_file_versions[0].file_url} download>Download v{active.workflow_file_versions[0].version_number} ↓</a>}
        <section className="workflow-version-history"><h3>Version history</h3>{active.workflow_file_versions.map(version => { const date = new Date(version.created_at); return <div key={version.id}><time>{date.getFullYear()}</time><span><small>{date.toLocaleDateString('en-US', { month: 'short' })}</small><strong>v{version.version_number} · {version.notes || version.file_name}</strong></span><a href={version.file_url} download>Download</a></div> })}</section>
      </div>
    </dialog>}
  </section>
}
