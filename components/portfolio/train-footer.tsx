'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Carriage = {
  id: 'work' | 'playground' | 'writing' | 'workflow'
  number: string
  label: string
  title: string
  description: string
  href?: string
}

const carriages: Carriage[] = [
  { id: 'work', number: '01', label: 'Work', title: 'Products made clearer', description: 'Selected case studies covering product thinking, systems and shipped outcomes.', href: '#work' },
  { id: 'playground', number: '02', label: 'Playground', title: 'Ideas in motion', description: 'Visual experiments, unfinished thoughts and small explorations without a brief.', href: '/playground' },
  { id: 'writing', number: '03', label: 'Writing', title: 'Notes from the journey', description: 'Essays about products, people, decisions and the details that shape an experience.', href: '/writing' },
  { id: 'workflow', number: '04', label: 'Workflow files', title: 'Tools for better work', description: 'A small library of personal agents and workflow files that make complex work feel lighter.', href: '/workflows' },
]

type PreviewItem = { title: string; description?: string | null; href?: string; image?: string | null }

export default function TrainFooter({ contactEmail, musicUrl, previews = {} }: { contactEmail?: string | null; musicUrl?: string | null; previews?: Partial<Record<Carriage['id'], PreviewItem[]>> }) {
  const [active, setActive] = useState<Carriage | null>(null)
  const [emailCopied, setEmailCopied] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const audioRef = useRef<AudioContext | null>(null)

  const stopAmbience = () => { void audioRef.current?.close(); audioRef.current = null; setSoundOn(false) }
  const startAmbience = () => {
    if (musicUrl) { const audio = new Audio(musicUrl); audio.loop = true; audio.volume = .28; void audio.play(); audioRef.current = { close: () => { audio.pause(); audio.src = '' } } as unknown as AudioContext; setSoundOn(true); return }
    stopAmbience()
    const context = new AudioContext()
    const master = context.createGain(); master.gain.value = 0.028; master.connect(context.destination)
    const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 620; filter.connect(master)
    ;[130.81, 164.81, 196].forEach((frequency, index) => { const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.value = index === 0 ? .5 : .22; oscillator.connect(gain).connect(filter); oscillator.start() })
    const movement = context.createOscillator(); const movementGain = context.createGain(); movement.type = 'sine'; movement.frequency.value = .08; movementGain.gain.value = 90; movement.connect(movementGain).connect(filter.frequency); movement.start()
    audioRef.current = context; setSoundOn(true)
  }
  const openCarriage = (carriage: Carriage) => { startAmbience(); setActive(carriage) }

  useEffect(() => {
    if (!active) return
    const previous = document.body.style.overflow
    const origin = document.activeElement as HTMLElement | null
    dialogRef.current?.showModal()
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setActive(null)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previous
      origin?.focus()
      stopAmbience()
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [active])

  const copyEmail = async () => {
    if (!contactEmail) return
    await navigator.clipboard.writeText(contactEmail)
    setEmailCopied(true)
    window.setTimeout(() => setEmailCopied(false), 1800)
  }

  return <>
    <footer className="train-footer" aria-label="Explore the portfolio train">
      <div className="train-viewport">
        <div className="train-sky" aria-hidden="true"><span /><span /></div>
        <div className="train-scenery" aria-hidden="true"><i /><i /><i /></div>
        <div className="train-motion train-drawn-motion">
          <div className="train-drawn-consist">
            {carriages.map((carriage, index) => <div className="train-drawn-coach" key={carriage.id}>
              <svg viewBox="0 0 300 76" aria-hidden="true">
                <defs><linearGradient id={`body-${index}`} x2="0" y2="1"><stop stopColor="#fff"/><stop offset=".45" stopColor="#d9dee0"/><stop offset="1" stopColor="#8b959a"/></linearGradient></defs>
                <path d={index === 3 ? 'M3 12H239Q266 12 295 55V62H3Z' : index === 0 ? 'M5 18Q5 12 15 12H297V62H5Z' : 'M3 12H297V62H3Z'} fill={`url(#body-${index})`} stroke="#859097" strokeWidth=".8"/>
                <path d={index === 3 ? 'M8 24H242L278 48H8Z' : 'M8 24H292V48H8Z'} fill="#29363d"/>
                <path d="M8 51H287V57H8Z" fill="#9db0ba"/>
                <path d="M10 19H242" stroke="#cc3028" strokeWidth="2"/>
                {[72,102,132,162,192].map(x => <rect key={x} x={x} y="28" width="24" height="15" rx="1" fill="#9cbcd0"/>)}
                <path d="M15 64H286" stroke="#343d42" strokeWidth="4"/>
                {[39,62,235,258].map(x => <g key={x}><circle cx={x} cy="67" r="7" fill="#30383c"/><circle cx={x} cy="67" r="4" fill="#9ba2a6"/><circle cx={x} cy="67" r="1.5" fill="#444"/></g>)}
                <path d="M90 10H180" stroke="#c2c9cc" strokeWidth="4"/>
                {index === 2 && <path d="M105 10L120 2H152L140 10M117 1H158" fill="none" stroke="#566168" strokeWidth="1.5"/>}
                {index < 3 && <path d="M296 23V60" stroke="#343d42" strokeWidth="5"/>}
              </svg>
              <button className="train-real-door" onClick={() => openCarriage(carriage)} aria-label={`Enter ${carriage.label} carriage`}><i/><span>{carriage.label} ↗</span></button>
            </div>)}
            <div className="train-vapor" aria-hidden="true"><i/><i/><i/></div>
          </div>
        </div>
        <div className="train-track" aria-hidden="true" />
      </div>
      <div className="train-footer-meta"><span>FA · 2026</span><span>A little journey.</span></div>
    </footer>

    {active && <dialog ref={dialogRef} className="carriage-experience" aria-labelledby="carriage-title" onCancel={() => setActive(null)} onMouseDown={(event) => event.target === event.currentTarget && setActive(null)}>
      <div className="carriage-room">
        <header className="carriage-room-header">
          <span>Carriage {active.number} · {active.label}</span>
          <div className="flex items-center gap-2"><button onClick={() => soundOn ? stopAmbience() : startAmbience()} aria-label={soundOn ? 'Mute carriage music' : 'Play carriage music'}>{soundOn ? 'Sound on' : 'Sound off'}</button><button ref={closeRef} onClick={() => setActive(null)} aria-label="Leave carriage">Close <span aria-hidden="true">×</span></button></div>
        </header>
        <div className="carriage-room-view">
          <div className="carriage-window-view" aria-hidden="true"><span /><span /><span /></div>
          <div className="carriage-copy">
            <p>{active.number} / 04</p>
            <h2 id="carriage-title">{active.title}</h2>
            <p>{active.description}</p>
            {previews[active.id]?.length ? <div className="carriage-preview-grid" aria-label={`${active.label} highlights`}>
              {previews[active.id]!.slice(0, 4).map((item) => <Link href={item.href || '#'} onClick={() => setActive(null)} key={item.title} className="carriage-preview-item">{item.image ? <img src={item.image} alt="" /> : <span className="carriage-preview-icon">{active.id === 'workflow' ? 'MD' : active.number}</span>}<strong>{item.title}</strong>{item.description && <span>{item.description}</span>}</Link>)}
            </div> : null}
            {active.href && <Link href={active.href} onClick={() => setActive(null)}>Explore {active.label.toLowerCase()} <span aria-hidden="true">↗</span></Link>}
          </div>
          <div className="carriage-seat" aria-hidden="true" />
        </div>
      </div>
    </dialog>}
  </>
}
