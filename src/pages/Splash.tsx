import { useEffect, useState } from 'react'
import { Plane } from 'lucide-react'

interface SplashProps {
  onDone: () => void
}

export function Splash({ onDone }: SplashProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400)
    const t2 = setTimeout(() => setPhase('out'), 1400)
    const t3 = setTimeout(onDone, 1750)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onDone])

  return (
    <div
      className={`min-h-dvh flex flex-col items-center justify-center px-8 transition-opacity duration-300 ${
        phase === 'out' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, rgba(139,107,207,0.28), transparent 55%), linear-gradient(165deg, #f7f5ff 0%, #ebe6f8 45%, #ddd4f8 100%)',
      }}
    >
      <div
        className={`flex flex-col items-center transition-all duration-500 ${
          phase === 'in' ? 'opacity-0 translate-y-3 scale-95' : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-3xl bg-lavender-400/30 blur-2xl scale-125" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-lavender-500 to-lavender-700 flex items-center justify-center shadow-lg shadow-lavender-500/30">
            <Plane className="w-9 h-9 text-white -rotate-45" strokeWidth={2.2} />
          </div>
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-navy-900 mb-1">AeroDesk</h1>
        <p className="text-[15px] text-navy-500 font-medium">Flight Operations Assistant</p>
        <div className="mt-10 w-40 h-px bg-lavender-300/60 relative overflow-hidden">
          <div
            className="absolute top-1/2 -translate-y-1/2 text-lavender-500"
            style={{ animation: 'plane-fly 1.6s ease-in-out infinite' }}
          >
            <Plane className="w-3.5 h-3.5 -rotate-45" />
          </div>
        </div>
      </div>
    </div>
  )
}
