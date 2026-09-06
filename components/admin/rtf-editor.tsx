'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import { Extension, Node, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Plugin } from '@tiptap/pm/state'
import { normalizeEmbedUrl } from '@/components/safe-embed'
import { useEffect, useState } from 'react'
import { normalizeExternalUrl } from '@/lib/content-utils'
import FileUpload from './file-upload'
import MediaLibrary from './media-library'

const HeadingMetadata = Extension.create({
  name: 'headingMetadata',
  addGlobalAttributes: () => [{ types: ['heading'], attributes: {
    id: { default: null },
    toc: { default: false, parseHTML: el => el.getAttribute('data-toc') === 'true', renderHTML: attrs => ({ 'data-toc': String(attrs.toc) }) },
  } }],
  addProseMirrorPlugins: () => [new Plugin({
    appendTransaction(transactions, _old, state) {
      if (!transactions.some(t => t.docChanged)) return null
      const seen = new Set<string>()
      const tr = state.tr
      state.doc.descendants((node, pos) => {
        if (node.type.name !== 'heading' || (!node.attrs.toc && !node.attrs.id)) return
        let id = node.attrs.id
        if (!id || seen.has(id)) { id = 'heading-' + crypto.randomUUID(); tr.setNodeMarkup(pos, undefined, { ...node.attrs, id }) }
        seen.add(id)
      })
      return tr.docChanged ? tr : null
    },
  })],
})
const ImageNode = Node.create({ name: 'documentImage', group: 'block', atom: true, draggable: true,
  addAttributes: () => ({ src: { default: '' }, alt: { default: '' } }),
  parseHTML: () => [{ tag: 'img[src]' }], renderHTML: ({ HTMLAttributes }) => ['img', HTMLAttributes],
})
const VideoNode = Node.create({ name: 'documentVideo', group: 'block', atom: true, draggable: true,
  addAttributes: () => ({ src: { default: '' } }),
  parseHTML: () => [{ tag: 'video[src]' }], renderHTML: ({ HTMLAttributes }) => ['video', mergeAttributes(HTMLAttributes, { controls: '', preload: 'metadata' })],
})
const EmbedNode = Node.create({ name: 'documentEmbed', group: 'block', atom: true, draggable: true,
  addAttributes: () => ({ url: { default: '', parseHTML: el => el.getAttribute('data-embed'), renderHTML: attrs => ({ 'data-embed': attrs.url }) } }),
  parseHTML: () => [{ tag: 'div[data-embed]' }], renderHTML: ({ HTMLAttributes }) => ['div', HTMLAttributes, 'Embedded content · ' + HTMLAttributes['data-embed']],
})

export default function RTFEditor({ value, onChange, placeholder = 'Start writing…', userId = '', toc = false }: { value: string; onChange: (html: string) => void; placeholder?: string; userId?: string; toc?: boolean }) {
  const [panel, setPanel] = useState<'link' | 'media' | 'embed' | null>(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [, refresh] = useState(0)
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), HeadingMetadata, ImageNode, VideoNode, EmbedNode],
    content: value, immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onTransaction: () => refresh(n => n + 1),
    editorProps: { attributes: { class: 'article-prose rich-text-editor document-canvas', 'aria-label': placeholder, 'data-placeholder': placeholder } },
  })
  useEffect(() => { if (editor && value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false }) }, [value, editor])
  if (!editor) return <p role="status">Loading editor…</p>
  const insertMedia = (src: string) => { editor.chain().focus().insertContent({ type: /\.(mp4|webm|mov)(?:[?#]|$)/i.test(src) ? 'documentVideo' : 'documentImage', attrs: { src } }).run(); setPanel(null) }
  const apply = () => {
    const href = normalizeExternalUrl(url)
    if (!/^https?:\/\/[^\s]+$/i.test(href)) { setError('Enter a valid website URL.'); return }
    if (panel === 'embed' && !normalizeEmbedUrl(href)) { setError('Use a YouTube, Vimeo, or Figma URL. For other websites, insert a link.'); return }
    if (panel === 'embed') editor.chain().focus().insertContent({ type: 'documentEmbed', attrs: { url: href } }).run()
    else if (editor.state.selection.empty) editor.chain().focus().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    setPanel(null); setError('')
  }
  const button = (label: string, action: () => void, active = false, disabled = false) => <button key={label} type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onClick={action}>{label}</button>
  return <div className="document-editor">
    <div className="document-toolbar" role="toolbar" aria-label="Document formatting">
      {button('Undo', () => { editor.chain().focus().undo().run() }, false, !editor.can().undo())}
      {button('Redo', () => { editor.chain().focus().redo().run() }, false, !editor.can().redo())}
      <select aria-label="Text style" value={editor.isActive('heading') ? editor.getAttributes('heading').level : 'paragraph'} onChange={e => e.target.value === 'paragraph' ? editor.chain().focus().setParagraph().run() : editor.chain().focus().setHeading({ level: Number(e.target.value) as 1 | 2 | 3 }).run()}>
        <option value="paragraph">Text</option><option value="1">Heading 1</option><option value="2">Heading 2</option><option value="3">Heading 3</option>
      </select>
      {button('Bold', () => { editor.chain().focus().toggleBold().run() }, editor.isActive('bold'))}
      {button('Italic', () => { editor.chain().focus().toggleItalic().run() }, editor.isActive('italic'))}
      {button('Bullets', () => { editor.chain().focus().toggleBulletList().run() }, editor.isActive('bulletList'))}
      {button('Numbered', () => { editor.chain().focus().toggleOrderedList().run() }, editor.isActive('orderedList'))}
      {button('Quote', () => { editor.chain().focus().toggleBlockquote().run() }, editor.isActive('blockquote'))}
      {button('Link', () => { setUrl(editor.getAttributes('link').href || ''); setPanel(panel === 'link' ? null : 'link') }, editor.isActive('link'))}
      {editor.isActive('link') && button('Unlink', () => { editor.chain().focus().unsetLink().run() })}
      {button('Media', () => setPanel(panel === 'media' ? null : 'media'))}
      {button('Embed', () => { setUrl(''); setPanel(panel === 'embed' ? null : 'embed') })}
      {button('Code', () => { editor.chain().focus().toggleCodeBlock().run() }, editor.isActive('codeBlock'))}
      {button('Divider', () => { editor.chain().focus().setHorizontalRule().run() })}
      {toc && editor.isActive('heading') && <label className="flex items-center gap-2 px-2 text-xs"><input type="checkbox" checked={Boolean(editor.getAttributes('heading').toc)} onChange={e => editor.chain().focus().updateAttributes('heading', { toc: e.target.checked, id: editor.getAttributes('heading').id || 'heading-' + crypto.randomUUID() }).run()} />Include in TOC</label>}
    </div>
    {panel && <div className="document-insert-panel">
      <div className="flex items-center justify-between mb-3"><span className="text-xs">{panel === 'media' ? 'Insert image or video' : panel === 'embed' ? 'Embed a supported video or design URL' : 'Add a link'}</span><button type="button" onClick={() => setPanel(null)}>Close</button></div>
      {panel === 'media' ? <><FileUpload userId={userId} folder="documents" accept="image/*,video/*" onUpload={insertMedia} /><MediaLibrary value={null} onSelect={insertMedia} /></> : <div className="flex gap-2"><input autoFocus aria-label="Website URL" className="min-w-0 flex-1 border rounded px-3" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); apply() } if (e.key === 'Escape') setPanel(null) }} placeholder="https://…" /><button type="button" onClick={apply}>Insert</button></div>}
      {error && <p role="alert">{error}</p>}
    </div>}
    <EditorContent editor={editor} />
  </div>
}
