import Link from 'next/link'
import CopyLinkButton from '@/components/copy-link-button'

export function DetailNavigation({ title, backHref = '/', showCopy = true }: { title: string; backHref?: string; showCopy?: boolean }) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-[52px] border-b border-foreground/8 bg-background/95 backdrop-blur-xl">
      <div className="h-full max-w-[1440px] mx-auto px-5 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-7 min-w-0">
          <Link href={backHref} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-foreground/[0.045] text-xs text-foreground/55 hover:text-foreground hover:bg-foreground/[0.075] transition-colors">
            <span aria-hidden="true">‹</span>
            Back
          </Link>
          <Link href="#top" className="hidden sm:block text-sm font-medium truncate hover:text-foreground/60 transition-colors">
            {title}
          </Link>
        </div>
        {showCopy && <CopyLinkButton className="border-0 bg-foreground/[0.045] hover:bg-foreground/[0.075]" />}
      </div>
    </header>
  )
}

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
    <>
      <DetailNavigation title={title} />
    <header id="top" className="mb-12 md:mb-16 pt-[84px]">
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
    </>
  )
}
