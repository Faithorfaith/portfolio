'use client'
import AppIcon from '@/components/icons/app-icon'
import { useEffect, useState } from 'react'
export default function BackToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const update = () => setVisible(window.scrollY > window.innerHeight * 1.4); update(); window.addEventListener('scroll', update, { passive: true }); return () => window.removeEventListener('scroll', update) }, [])
  return <button type="button" className={`back-to-top ${visible ? 'is-visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"><AppIcon name="ArrowUp" /> <span>Top</span></button>
}
