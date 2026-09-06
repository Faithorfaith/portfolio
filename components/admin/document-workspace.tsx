'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import FileUpload from './file-upload'
import MediaLibrary from './media-library'
import SafeHtml from '@/components/safe-html'

const Editor = dynamic(() => import('./rtf-editor'), { ssr: false })
interface Props {
  title: string; subtitle: string; html: string; cover: string | null
  onTitle: (value: string) => void; onSubtitle: (value: string) => void
  onChange: (html: string) => void; onCover: (url: string) => void
  onBack: () => void; onSave: () => void; saving: boolean; dirty: boolean
  published: boolean; onPublished: (value: boolean) => void
  error: string | null; settings: ReactNode; recovery: ReactNode
  toc?: boolean; userId?: string; busy?: boolean
}
export default function DocumentWorkspace(props: Props) {
  const [preview, setPreview] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [userId, setUserId] = useState(props.userId || '')
  const drawer = useRef<HTMLDialogElement>(null)
  const settingsButton = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (!userId) createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id || '')) }, [userId])
  const close = () => { drawer.current?.close(); settingsButton.current?.focus() }
  return <div className="document-workspace">
    <header className="document-topbar">
      <button type="button" onClick={props.onBack} aria-label="Back to list">‹ Back</button>
      <span role="status" className="text-[11px] text-foreground/60 mr-auto">{props.saving ? 'Saving online…' : props.dirty ? 'Changes pending · recovery in Settings' : 'No pending changes'}</span>
      <button type="button" aria-pressed={preview} onClick={() => setPreview(!preview)}>{preview ? 'Edit' : 'Preview'}</button>
      <button ref={settingsButton} type="button" onClick={() => drawer.current?.showModal()}>Settings</button>
      <button type="button" className="document-save" disabled={props.saving || props.busy} onClick={props.onSave}>{props.saving ? 'Saving…' : props.published ? 'Save & publish' : 'Save draft'}</button>
    </header>
    {props.error && <p role="alert" className="max-w-[600px] mx-auto p-4 text-sm text-red-600">{props.error}</p>}
    <div className="document-sheet" style={{ maxWidth: preview && mobile ? 375 : 600 }}>
      {preview ? <>
        <button type="button" className="text-xs text-foreground/60 mb-8" onClick={() => setMobile(!mobile)}>{mobile ? 'Mobile preview · switch to desktop' : 'Desktop preview · switch to mobile'}</button>
        <h1 className="text-[18px] font-medium mb-4">{props.title || 'Untitled'}</h1>
        {props.subtitle && <p className="text-sm leading-relaxed text-foreground/60 mb-8">{props.subtitle}</p>}
        {props.cover && <img src={props.cover.split('#')[0]} alt="" className="w-full h-auto mb-8" />}
        <SafeHtml html={props.html} className="article-prose" />
      </> : <>
        <input aria-label="Title" placeholder="Title" className="document-title" value={props.title} onChange={e => props.onTitle(e.target.value)} />
        <textarea aria-label="Subtitle" placeholder="Add a short description…" rows={2} className="document-subtitle" value={props.subtitle} onChange={e => props.onSubtitle(e.target.value)} />
        <Editor value={props.html} onChange={props.onChange} userId={userId} toc={props.toc} />
      </>}
    </div>
    <dialog ref={drawer} className="document-settings" onCancel={e => { e.preventDefault(); close() }} onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center"><h2 className="text-sm font-medium">Document settings</h2><button type="button" onClick={close}>Close</button></div>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={props.published} onChange={e => props.onPublished(e.target.checked)} />Publish when saved</label>
        <details><summary>Cover image</summary><div className="space-y-3 pt-4">
          {props.cover && <img src={props.cover.split('#')[0]} alt="Cover" className="w-full max-h-48 object-cover" />}
          <FileUpload userId={userId} folder="covers" accept="image/*" onUpload={props.onCover} />
          <MediaLibrary value={props.cover} onSelect={props.onCover} />
        </div></details>
        {props.settings}
        <details><summary>Recovery, revisions & publishing checks</summary><div className="pt-4">{props.recovery}</div></details>
      </div>
    </dialog>
  </div>
}
