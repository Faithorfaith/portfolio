'use client'

import { useEffect, useState } from 'react'

export default function HomePresence({ deskNote, listening }: { currentFocus?: string | null; deskNote?: string | null; listening?: boolean }) {
  const [lagosTime, setLagosTime] = useState('')
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const update = () => {
      const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: 'numeric', hour12: false }).format(new Date()))
      setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')
      document.documentElement.dataset.timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'day' : 'evening'
      setLagosTime(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      }).format(new Date()))
    }
    update()
    const interval = window.setInterval(update, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  return <aside className="home-presence" aria-label="A note from Faith's desk">
    <div className="home-presence-meta">
      <span><i aria-hidden="true" /> {greeting || 'Lagos'}{lagosTime ? ` · ${lagosTime}` : ''}</span>
    </div>
    {deskNote && <p><span>On my desk</span>{deskNote}</p>}
    {listening && <p className="home-presence-listening"><span>Currently listening</span>Soft sounds from the footer journey</p>}
  </aside>
}
