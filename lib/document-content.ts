// Legacy records stay untouched until the document is edited.
export const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
type LegacySection = { id: string; label: string; title: string | null; toc: string | null; body: string; image: string | null; video_url?: string | null; embed_url?: string | null; blocks?: { type: string; content?: string; imageUrl?: string; buttons?: { text: string; link: string }[] }[] }
export function sectionsToDocument(sections: LegacySection[]) {
  return sections.map(s => {
    const heading = s.title || s.label || s.toc
    return `${heading ? `<h2 id="${escapeHtml(s.id)}" data-toc="${Boolean(s.toc)}">${escapeHtml(heading)}</h2>` : ''}${s.title && s.label && s.label !== s.title ? `<p>${escapeHtml(s.label)}</p>` : ''}${s.image ? `<img src="${escapeHtml(s.image)}" alt="">` : ''}${s.video_url ? `<video src="${escapeHtml(s.video_url)}" controls></video>` : ''}${s.embed_url ? `<div data-embed="${escapeHtml(s.embed_url)}"></div>` : ''}${s.body}${(s.blocks || []).map(b => b.type === 'buttons' ? (b.buttons || []).map(button => `<p><a href="${escapeHtml(button.link)}">${escapeHtml(button.text)}</a></p>`).join('') : b.type === 'image' && b.imageUrl ? `<img src="${escapeHtml(b.imageUrl)}" alt="">` : b.type === 'divider' ? '<hr>' : b.content || '').join('')}`
  }).join('')
}
export function blocksToDocument(blocks: { id: string; type: string; content: string; level?: number }[]) {
  return blocks.map(b => b.type === 'heading' ? `<h${Math.min(3, b.level || 2)} id="block-${escapeHtml(b.id)}">${b.content}</h${Math.min(3, b.level || 2)}>` : b.type === 'image' ? `<img src="${escapeHtml(b.content)}" alt="">` : b.type === 'divider' ? '<hr>' : b.type === 'quote' ? `<blockquote>${b.content}</blockquote>` : b.content).join('')
}
export function documentNavigation(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return Array.from(doc.querySelectorAll('h1[data-toc="true"],h2[data-toc="true"],h3[data-toc="true"]')).filter(h => h.id && h.textContent?.trim()).map(h => ({ id: h.id, label: h.textContent!.trim(), toc: h.textContent!.trim() }))
}
