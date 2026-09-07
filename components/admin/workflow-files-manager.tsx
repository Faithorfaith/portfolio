'use client'

import { useCallback, useEffect, useState } from 'react'
import FileUpload from './file-upload'
import type { WorkflowFile } from '@/lib/workflow-files'

export default function WorkflowFilesManager({ userId }: { userId: string }) {
  const [files, setFiles] = useState<WorkflowFile[]>([])
  const [editing, setEditing] = useState<WorkflowFile | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [published, setPublished] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('AGENTS.md')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const load = useCallback(async () => { const res = await fetch('/api/workflow-files?admin=1'); const data = await res.json(); if (res.ok) setFiles(data); else setError(data.error || 'Run scripts/16-add-workflow-files.sql first.') }, [])
  useEffect(() => { void load() }, [load])
  const request = async (body: object) => { const res = await fetch('/api/workflow-files', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); return data }
  const select = (file: WorkflowFile) => { setEditing(file); setName(file.name); setDescription(file.description || ''); setPublished(file.published); setFileUrl(''); setNotes('') }
  const create = async () => { try { const file = await request({ action: 'create', name: 'Untitled workflow', description: '', published: false }); await load(); select({ ...file, workflow_file_versions: [] }) } catch (e) { setError(e instanceof Error ? e.message : 'Could not create file') } }
  const save = async () => { if (!editing) return; try { await request({ action: 'update', id: editing.id, name, description, published }); await load(); setError('') } catch (e) { setError(e instanceof Error ? e.message : 'Could not save') } }
  const addVersion = async () => { if (!editing || !fileUrl) return; try { await request({ action: 'version', id: editing.id, fileUrl, fileName, notes }); setFileUrl(''); setNotes(''); await load(); setEditing(null); setError('') } catch (e) { setError(e instanceof Error ? e.message : 'Could not add version') } }
  if (editing) return <div className="max-w-2xl space-y-8"><button className="text-xs text-foreground/50" onClick={() => setEditing(null)}>‹ Back to files</button><div><h2 className="text-lg font-medium">{editing.name}</h2><p className="text-xs text-foreground/45 mt-1">Edit details or upload a new version.</p></div>
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    <div className="grid gap-4"><label className="text-xs space-y-2"><span>Name</span><input className="w-full border rounded-lg p-3 bg-background" value={name} onChange={e => setName(e.target.value)}/></label><label className="text-xs space-y-2"><span>Description</span><textarea className="w-full border rounded-lg p-3 bg-background" rows={3} value={description} onChange={e => setDescription(e.target.value)}/></label><label className="flex gap-2 text-xs"><input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}/>Published</label><button onClick={save} className="w-fit rounded-lg bg-foreground text-background px-4 py-2 text-xs">Save details</button></div>
    <section className="border-t pt-7 space-y-4"><div><h3 className="text-sm font-medium">Add version {editing.workflow_file_versions.length + 1}</h3><p className="text-[11px] text-foreground/45 mt-1">Every upload becomes a permanent numbered version.</p></div><FileUpload userId={userId} folder="workflow-files" accept=".md,.txt,.pdf,.zip" onUpload={setFileUrl}/>{fileUrl && <><label className="text-xs block space-y-2"><span>File name</span><input className="w-full border rounded-lg p-3" value={fileName} onChange={e => setFileName(e.target.value)}/></label><label className="text-xs block space-y-2"><span>What changed?</span><input className="w-full border rounded-lg p-3" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Improved research workflow"/></label><button onClick={addVersion} className="rounded-lg bg-foreground text-background px-4 py-2 text-xs">Publish new version</button></>}</section>
    <section className="border-t pt-7"><h3 className="text-sm font-medium mb-3">Version history</h3><div className="space-y-2">{editing.workflow_file_versions.sort((a,b) => b.version_number-a.version_number).map(v => <div key={v.id} className="grid grid-cols-[40px_1fr_auto] gap-3 border-b py-3 text-xs"><strong>v{v.version_number}</strong><span>{v.notes || v.file_name}</span><a href={v.file_url} target="_blank" rel="noreferrer">Download</a></div>)}</div></section></div>
  return <div className="max-w-3xl space-y-7"><div className="flex justify-between"><div><h2 className="text-lg font-medium">Workflow files</h2><p className="text-xs text-foreground/45 mt-1">Reusable AGENTS.md files and personal workflow tools.</p></div><button onClick={() => void create()} className="rounded-lg bg-foreground text-background px-4 py-2 text-xs">New file</button></div>{error && <p role="alert" className="text-xs text-red-600">{error}</p>}<div className="divide-y border-y">{files.map(file => <button key={file.id} onClick={() => select(file)} className="w-full grid grid-cols-[32px_1fr_auto] gap-3 items-center py-4 text-left"><span className="text-lg">▧</span><span><strong className="block text-sm font-normal">{file.name}</strong><small className="text-[11px] text-foreground/45 line-clamp-1">{file.description}</small></span><span className="text-[11px] text-foreground/45">{file.workflow_file_versions.length ? `v${Math.max(...file.workflow_file_versions.map(v => v.version_number))}` : 'No versions'}</span></button>)}</div></div>
}
