export function normalizeEmbedUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null
    if (url.hostname === 'youtu.be') return `https://www.youtube.com/embed/${url.pathname.slice(1)}`
    if (url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com')) {
      const id = url.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
      if (url.pathname.startsWith('/embed/')) return url.toString()
    }
    if (url.hostname === 'vimeo.com' || url.hostname.endsWith('.vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop()
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`
    }
    if (url.hostname === 'www.figma.com' || url.hostname === 'figma.com') {
      return `https://www.figma.com/embed?embed_host=portfolio&url=${encodeURIComponent(url.toString())}`
    }
  } catch {}
  return null
}

export default function SafeEmbed({ url, title }: { url: string; title: string }) {
  const src = normalizeEmbedUrl(url)
  if (!src) return null

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-foreground/[0.035]">
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 w-full h-full border-0"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}
