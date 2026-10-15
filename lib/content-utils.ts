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

export function normalizeWhatsAppUrl(value: string | null | undefined) {
  const input = cleanInlineText(value)
  if (!input) return ''
  if (/^(https?:\/\/)?(www\.)?(wa\.me|api\.whatsapp\.com)\//i.test(input)) return normalizeExternalUrl(input)
  const phone = input.replace(/\D/g, '')
  return phone.length >= 7 ? `https://wa.me/${phone}` : normalizeExternalUrl(input)
}
