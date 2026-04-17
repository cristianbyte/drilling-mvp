import HoleLog from '../components/HoleLog'
import Toast, { useToast } from '../components/Toast'
import { firebaseReady, deleteHole } from '../lib/firebase'
import ShiftHeader from '../components/ShiftHeader'
import HoleEntry from '../components/HoleEntry'
import { useState } from 'react'

export default function OperatorForm(){
const [shift, setShift] = useState(null)
  const [holes, setHoles] = useState([])
  const toastState = useToast()

  const totalMeters  = holes.reduce((sum, h) => sum + h.depth, 0)
  const nextHoleNumber = holes.length + 1

  function handleShiftFrozen(shiftData) {
    setShift(shiftData)
  }

  function handleHoleSaved(hole) {
    setHoles(prev => [...prev, hole])
  }

  async function handleHoleDelete(holeId) {
    // Optimistic remove — fire-and-forget Firebase
    setHoles(prev => prev.filter(h => h.holeId !== holeId))
    try {
      await deleteHole(holeId)
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  function handleReset() {
    if (holes.length && !window.confirm('¿Resetear turno? Los datos ya están guardados en Firebase.')) return
    setShift(null)
    setHoles([])
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-base)', paddingBottom: '5rem' }}>

      {/* ── App Bar ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'color-mix(in srgb, var(--color-surface-1) 95%, transparent)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-border-subtle)',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--color-text-muted)' }}>
            FOR-PO-04
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-border-strong)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--color-brand-amber)' }}>
            Perforación
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5625rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: firebaseReady ? 'var(--color-brand-emerald)' : 'var(--color-text-faint)',
          }}>
            {firebaseReady ? '● Online' : '○ Offline'}
          </span>

          {shift && (
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-text-muted)',
                transition: 'color 0.15s',
                padding: '0.25rem',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              Reset
            </button>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <div style={{ paddingTop: '1rem' }}>
        <ShiftHeader onFrozen={handleShiftFrozen} />

        {shift && (
          <>
            <HoleEntry
              shiftId={shift.shiftId}
              nextHoleNumber={nextHoleNumber}
              onSaved={handleHoleSaved}
            />
            <HoleLog
              holes={holes}
              totalMeters={totalMeters}
              onDelete={handleHoleDelete}
            />
          </>
        )}
      </div>

      <Toast state={toastState} />
    </div>
  )
}