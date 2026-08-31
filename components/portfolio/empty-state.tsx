const DOODLE_1 = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-YTOZb6UgMNL2WcsNjULSUsbLb1fmjk.png'
const DOODLE_2 = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-hSQCOVk4FK1TJNrE7ZbEJgsiYal1rr.png'

export interface EmptyStateProps {
  title: string
  description?: string
  doodleVariant?: 1 | 2
}

export default function EmptyState({ 
  title, 
  description = 'Coming soon...',
  doodleVariant = 1
}: EmptyStateProps) {
  const doodleImage = doodleVariant === 1 ? DOODLE_1 : DOODLE_2

  return (
    <div className="w-full max-w-2xl mx-auto px-8 py-24 md:py-32 flex flex-col items-center justify-center text-center relative">
      {/* Background Doodles */}
      <div className="fixed pointer-events-none z-30 top-16 left-5">
        <img 
          src={DOODLE_1}
          alt="Doodle decoration" 
          className="w-16 h-16 md:w-20 md:h-20 animate-doodle-shake"
        />
      </div>
      <div className="fixed pointer-events-none z-30 bottom-40 right-5">
        <img 
          src={DOODLE_2}
          alt="Doodle decoration" 
          className="w-16 h-16 md:w-20 md:h-20 animate-doodle-shake"
        />
      </div>

      {/* Main Doodle */}
      <img 
        src={doodleImage} 
        alt="Coming soon decoration"
        className="w-24 h-24 md:w-32 md:h-32 mb-8 animate-doodle-shake"
      />
      
      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-medium text-foreground mb-3">
        {title}
      </h2>
      
      {/* Description */}
      <p className="text-foreground/60 text-lg">
        {description}
      </p>
    </div>
  )
}
