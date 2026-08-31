'use client'

import { useState } from 'react'
import Image from 'next/image'

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

  return (
    <div className={`overflow-hidden bg-foreground/[0.035] ${containerClassName} ${fill ? 'relative' : ''}`}>
      {fill ? (
        <Image
          src={src}
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
          src={src}
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
