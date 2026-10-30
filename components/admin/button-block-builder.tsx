'use client'

import { useState } from 'react'
import { v4 as uuid } from 'uuid'

interface ButtonItem {
  id: string
  text: string
  link: string
  variant: 'primary' | 'secondary' | 'outline'
}

interface ButtonBlockProps {
  buttons: ButtonItem[]
  onChange: (buttons: ButtonItem[]) => void
}

export default function ButtonBlockBuilder({ buttons = [], onChange }: ButtonBlockProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const addButton = () => {
    const newButton: ButtonItem = {
      id: uuid(),
      text: 'Button Text',
      link: 'https://example.com',
      variant: 'primary'
    }
    onChange([...buttons, newButton])
  }

  const updateButton = (id: string, field: keyof ButtonItem, value: string) => {
    onChange(
      buttons.map(btn =>
        btn.id === id ? { ...btn, [field]: value } : btn
      )
    )
  }

  const deleteButton = (id: string) => {
    onChange(buttons.filter(btn => btn.id !== id))
  }

  const moveButton = (id: string, direction: 'up' | 'down') => {
    const index = buttons.findIndex(btn => btn.id === id)
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === buttons.length - 1)) {
      return
    }
    const newButtons = [...buttons]
    const [btn] = newButtons.splice(index, 1)
    newButtons.splice(direction === 'up' ? index - 1 : index + 1, 0, btn)
    onChange(newButtons)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground/60">Buttons</label>
        <button
          onClick={addButton}
          className="px-2 py-1 text-xs border rounded hover:bg-foreground/5 transition-colors"
        >
          + Add Button
        </button>
      </div>

      <div className="space-y-2">
        {buttons.map((btn, index) => (
          <div key={btn.id} className="group relative p-3 border rounded-lg bg-foreground/5 space-y-2">
            {/* Move buttons */}
            <div className="absolute -left-6 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => moveButton(btn.id, 'up')}
                disabled={index === 0}
                className="p-0.5 text-foreground/40 hover:text-foreground disabled:opacity-20"
              >
                ↑
              </button>
              <button
                onClick={() => moveButton(btn.id, 'down')}
                disabled={index === buttons.length - 1}
                className="p-0.5 text-foreground/40 hover:text-foreground disabled:opacity-20"
              >
                ↓
              </button>
            </div>

            {/* Delete button */}
            <button
              onClick={() => deleteButton(btn.id)}
              className="absolute -right-3 -top-3 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>

            <input
              type="text"
              value={btn.text}
              onChange={(e) => updateButton(btn.id, 'text', e.target.value)}
              placeholder="Button text"
              className="w-full px-2 py-1 text-xs border rounded bg-background"
            />
            <input
              type="text"
              value={btn.link}
              onChange={(e) => updateButton(btn.id, 'link', e.target.value)}
              placeholder="https://example.com"
              className="w-full px-2 py-1 text-xs border rounded bg-background"
            />
            <select
              value={btn.variant}
              onChange={(e) => updateButton(btn.id, 'variant', e.target.value)}
              className="w-full px-2 py-1 text-xs border rounded bg-background"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
