export type WritingBackground = 'white' | 'cream' | 'sky' | 'sage' | 'blush'
export type WritingTypeface = 'sans' | 'handwritten'
export type WritingAppearance = { background: WritingBackground; typeface: WritingTypeface }

export const defaultWritingAppearance: WritingAppearance = { background: 'white', typeface: 'sans' }

export const writingBackgrounds: Array<{ id: WritingBackground; label: string; color: string }> = [
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'cream', label: 'Warm paper', color: '#fff9e8' },
  { id: 'sky', label: 'Soft sky', color: '#eef7fb' },
  { id: 'sage', label: 'Pale sage', color: '#f0f5ed' },
  { id: 'blush', label: 'Soft blush', color: '#fbf0ed' },
]

export const appearanceBlock = (appearance: WritingAppearance) => ({
  id: 'writing-appearance',
  type: 'appearance' as const,
  content: JSON.stringify(appearance),
})

export function getWritingAppearance(blocks: Array<{ type: string; content?: string }> | null | undefined): WritingAppearance {
  const raw = blocks?.find(block => block.type === 'appearance')?.content
  if (!raw) return defaultWritingAppearance
  try {
    const parsed = JSON.parse(raw)
    const background = writingBackgrounds.some(item => item.id === parsed.background) ? parsed.background : 'white'
    const typeface = parsed.typeface === 'handwritten' ? 'handwritten' : 'sans'
    return { background, typeface }
  } catch {
    return defaultWritingAppearance
  }
}

export const writingBackgroundColor = (background: WritingBackground) => writingBackgrounds.find(item => item.id === background)?.color || '#ffffff'
