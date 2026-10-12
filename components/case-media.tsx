'use client'

export default function CaseMedia({ src }: { src: string }) {
  const path = src.split(/[?#]/)[0]
  if (/\.(mp4|webm|mov|m4v)$/i.test(path)) return <video src={src} controls playsInline preload="metadata" className="h-full w-full object-contain" />
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(path)) return <audio src={src} controls preload="metadata" className="w-full" />
  if (/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(path)) return <img src={src} alt="Case study media" loading="lazy" className="h-full w-full object-contain" />
  return <a href={src} target="_blank" rel="noopener noreferrer" className="p-6 underline">Open attachment</a>
}
