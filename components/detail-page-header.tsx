import Link from 'next/link'
import CopyLinkButton from '@/components/copy-link-button'

export default function DetailPageHeader({
  title,
  eyebrow,
  description,
}: {
  title: string
  eyebrow?: string | null
  description?: string | null
}) {
  return (
    <header className="mb-12 md:mb-16">
      <div className="flex items-center justify-between mb-12">
        <Link href="/" className="text-sm text-foreground/45 hover:text-foreground transition-colors">
          ← Back
        </Link>
        <CopyLinkButton />
      </div>

      {eyebrow && <p className="text-[11px] text-foreground/40 mb-3">{eyebrow}</p>}
      <h1 className="text-[18px] font-medium tracking-[-0.01em] text-foreground max-w-2xl">
        {title}
      </h1>
      {description && (
        <p className="mt-5 max-w-xl text-sm text-foreground/60 leading-relaxed">
          {description}
        </p>
      )}
    </header>
  )
}
