export function cleanInlineText(value: string | null | undefined) {
  return (value || '')
    .replace(/&#x20;|&#32;|&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeExternalUrl(value: string | null | undefined) {
  const url = cleanInlineText(value)
  if (!url) return ''
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`
  return `https://${url.replace(/^\/+/, '')}`
}
