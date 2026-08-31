'use client'

const DOODLE_1 = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-YTOZb6UgMNL2WcsNjULSUsbLb1fmjk.png'
const DOODLE_2 = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-hSQCOVk4FK1TJNrE7ZbEJgsiYal1rr.png'

export default function Doodles() {
  return (
    <>
      {/* Top-left doodle */}
      <div className="fixed pointer-events-none z-30 top-16 left-5">
        <img 
          src={DOODLE_1}
          alt="" 
          className="w-12 h-12 md:w-14 md:h-14 animate-doodle-shake"
        />
      </div>
      {/* Bottom-right doodle */}
      <div className="fixed pointer-events-none z-30 bottom-40 right-5">
        <img 
          src={DOODLE_2}
          alt="" 
          className="w-12 h-12 md:w-14 md:h-14 animate-doodle-shake"
        />
      </div>
    </>
  )
}
