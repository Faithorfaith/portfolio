'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { imageFocus } from '@/lib/image-focus'

interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  containerClassName?: string
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
}

export default function ProgressiveImage({
  src,
  alt,
  className = 'w-full h-auto',
  containerClassName = '',
  priority = false,
  fill = false,
  width,
  height,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px',
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const focus = imageFocus(src)
  const [original, setOriginal] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => { setIsLoaded(false); setOriginal(false); setFailed(false) }, [src])
  const handleError = () => { if (!original) setOriginal(true); else setFailed(true) }

  return (
    <div aria-busy={!isLoaded && !failed} className={`overflow-hidden bg-foreground/[0.035] ${containerClassName} ${fill ? 'relative' : ''}`}>
      {failed ? <span className="flex min-h-24 h-full items-center justify-center p-4 text-xs text-foreground/60">Image unavailable{alt ? ` · ${alt}` : ''}</span> : fill ? (
        <Image
          key={`${src}-${original}`}
          unoptimized={original}
          onError={handleError}
          src={focus.src}
          style={{ objectPosition: focus.position }}
          alt={alt}
          fill
          sizes={sizes}
          className={`object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={() => setIsLoaded(true)}
          priority={priority}
          quality={85}
        />
      ) : (
        <Image
          key={`${src}-${original}`}
          unoptimized={original}
          onError={handleError}
          src={focus.src}
          style={{ objectPosition: focus.position }}
          alt={alt}
          width={width || 1200}
          height={height || 900}
          sizes={sizes}
          className={`transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={() => setIsLoaded(true)}
          priority={priority}
          quality={85}
        />
      )}
    </div>
  )
}
