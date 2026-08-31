'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import { useEffect } from 'react'

interface RTFEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function RTFEditor({ value, onChange, placeholder = 'Enter content...' }: RTFEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      BulletList,
      OrderedList,
      ListItem,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4 border rounded-lg bg-background text-foreground',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return <div className="p-4 border rounded-lg bg-background">Loading editor...</div>

  const setLink = () => {
    const currentHref = editor.getAttributes('link').href as string | undefined
    const href = window.prompt('Paste a link URL', currentHref || 'https://')
    if (href === null) return
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim(), target: '_blank' }).run()
  }

  return (
    <div className="space-y-2 border rounded-lg bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-3 border-b bg-foreground/5">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            editor.isActive('bold') ? 'bg-foreground text-background' : 'hover:bg-foreground/10'
          }`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-sm italic transition-colors ${
            editor.isActive('italic') ? 'bg-foreground text-background' : 'hover:bg-foreground/10'
          }`}
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 rounded text-sm line-through transition-colors ${
            editor.isActive('strike') ? 'bg-foreground text-background' : 'hover:bg-foreground/10'
          }`}
          title="Strikethrough"
        >
          S
        </button>
        <div className="border-l border-foreground/20" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded text-sm font-bold transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-foreground text-background' : 'hover:bg-foreground/10'
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded text-sm font-bold transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-foreground text-background' : 'hover:bg-foreground/10'
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded text-sm font-bold transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-foreground text-background' : 'hover:bg-foreground/10'
          }`}
          title="Heading 3"
        >
          H3
        </button>
        <div className="border-l border-foreground/20" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
            editor.isActive('bulletList') ? 'bg-foreground text-background' : 'hover:bg-foreground/10'
          }`}
          title="Bullet List"
        >
          <span>•</span> List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
            editor.isActive('orderedList') ? 'bg-foreground text-background' : 'hover:bg-foreground/10'
          }`}
          title="Ordered List"
        >
          <span>1.</span> List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            editor.isActive('blockquote') ? 'bg-foreground text-background' : 'hover:bg-foreground/10'
          }`}
          title="Blockquote"
        >
          "
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-2 py-1 rounded text-sm font-mono transition-colors ${
            editor.isActive('codeBlock') ? 'bg-foreground text-background' : 'hover:bg-foreground/10'
          }`}
          title="Code Block"
        >
          {'<>'}
        </button>
        <div className="border-l border-foreground/20" />
        <button
          type="button"
          onClick={setLink}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            editor.isActive('link') ? 'bg-foreground text-background' : 'hover:bg-foreground/10'
          }`}
          title="Add or edit link"
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
          disabled={!editor.isActive('link')}
          className="px-2 py-1 rounded text-sm hover:bg-foreground/10 disabled:opacity-30 transition-colors"
          title="Remove link"
        >
          Unlink
        </button>
        <div className="border-l border-foreground/20" />
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-2 py-1 rounded text-sm hover:bg-foreground/10 transition-colors"
          title="Divider"
        >
          ―
        </button>
        <button
          onClick={() => editor.chain().focus().clearNodes().run()}
          className="px-2 py-1 rounded text-sm hover:bg-foreground/10 transition-colors"
          title="Clear formatting"
        >
          ⟲
        </button>
      </div>
      
      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}
