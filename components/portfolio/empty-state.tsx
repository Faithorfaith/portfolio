export interface EmptyStateProps {
  title: string
  description?: string
}

export default function EmptyState({ 
  title, 
  description = 'Coming soon...'
}: EmptyStateProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-5 sm:px-8 py-24 md:py-32 flex flex-col items-start justify-center text-left relative">
      {/* Title */}
      <h2 className="text-[18px] font-medium tracking-[-0.01em] text-foreground mb-2">
        {title}
      </h2>
      
      {/* Description */}
      <p className="text-foreground/50 text-base">
        {description}
      </p>
    </div>
  )
}
