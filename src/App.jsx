import { useState } from 'react'
import ShiftHeader from './components/ShiftHeader'
import HoleEntry from './components/HoleEntry'
import HoleLog from './components/HoleLog'
import Toast, { useToast } from './components/Toast'
import { firebaseReady } from './lib/firebase'

export default function App() {
  // shift is null until header is frozen
  const [shift, setShift] = useState(null)
  const [holes, setHoles] = useState([])
  const toastState = useToast()

  const totalMeters = holes.reduce((sum, h) => sum + h.depth, 0)
  const nextHoleNumber = holes.length + 1

  function handleShiftFrozen(shiftData) {
    setShift(shiftData)
  }

  function handleHoleSaved(hole) {
    setHoles(prev => [...prev, hole])
  }

  function handleReset() {
    if (holes.length && !window.confirm('¿Resetear turno? Los datos ya están guardados en Firebase.')) return
    setShift(null)
    setHoles([])
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* ── App Bar ── */}
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            FOR-PO-04
          </span>
          <span className="text-slate-700 font-mono">·</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-400">
            Perforación
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Firebase status */}
          <span className={`font-mono text-[9px] uppercase tracking-wider ${firebaseReady ? 'text-emerald-500' : 'text-slate-600'}`}>
            {firebaseReady ? '● Online' : '○ Offline'}
          </span>
          {/* Reset button — only when shift is active */}
          {shift && (
            <button
              onClick={handleReset}
              className="ml-3 font-mono text-[10px] uppercase tracking-wider text-slate-500 hover:text-red-400 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="pt-4">
        {/* Shift Header — always visible, frozen after submit */}
        <ShiftHeader onFrozen={handleShiftFrozen} />

        {/* Hole entry + log — only after shift is frozen */}
        {shift && (
          <>
            <HoleEntry
              shiftId={shift.shiftId}
              nextHoleNumber={nextHoleNumber}
              onSaved={handleHoleSaved}
            />
            <HoleLog holes={holes} totalMeters={totalMeters} />
          </>
        )}
      </div>

      <Toast state={toastState} />
    </div>
  )
}