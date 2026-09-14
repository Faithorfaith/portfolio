'use client'

import { useEffect, useState } from 'react'

export default function HomePresence({ currentFocus, deskNote }: { currentFocus?: string | null; deskNote?: string | null }) {
  const [lagosTime, setLagosTime] = useState('')

  useEffect(() => {
    const update = () => setLagosTime(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date()))
    update()
    const interval = window.setInterval(update, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  return <aside className="home-presence" aria-label="A note from Faith's desk">
    <div className="home-presence-meta">
      <span><i aria-hidden="true" /> Lagos{lagosTime ? ` · ${lagosTime}` : ''}</span>
      <span>Currently · {currentFocus || 'Making thoughtful things for the web'}</span>
    </div>
    {deskNote && <p><span>On my desk</span>{deskNote}</p>}
  </aside>
}
