import { useState } from 'react'
import ConfirmModal from './ConfirmModal'
import { showToast } from './Toast'

// Trash icon — inline SVG, no dep
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

export default function HoleLog({ holes, totalMeters, onDelete }) {
  // holeId pending delete confirmation
  const [pendingDelete, setPendingDelete] = useState(null)

  const targetHole = holes.find(h => h.holeId === pendingDelete)

  function handleDeleteConfirm() {
    onDelete(pendingDelete)
    showToast(`Barreno B-${String(targetHole.holeNumber).padStart(2,'0')} eliminado`)
    setPendingDelete(null)
  }

  const deleteRows = targetHole ? [
    { key: '# Barreno',   val: `B-${String(targetHole.holeNumber).padStart(2,'0')}`, accent: true },
    { key: 'Profundidad', val: targetHole.depth.toFixed(1) + ' m', accent: true },
    { key: 'Techo',       val: targetHole.ceiling.toFixed(1) + ' m' },
    { key: 'Piso',        val: targetHole.floor.toFixed(1)   + ' m' },
  ] : []

  return (
    <>
      <div className="section-card">
        <div className="section-header">
          <div className="dot" style={{ background: 'var(--color-border-strong)' }} />
          <span className="section-title">Registros del turno</span>
          {/* Running total */}
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-brand-amber)' }}>
              {totalMeters.toFixed(1)} m
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>
              Total perforado
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
          {holes.length === 0 ? (
            <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-faint)', padding: '2rem 0' }}>
              Aún no hay registros
            </p>
          ) : (
            [...holes].reverse().map((h, i) => (
              <div
                key={h.holeId}
                className={i === 0 ? 'slide-down' : ''}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--color-border-subtle)',
                }}
              >
                {/* Left: number + detail */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-brand-cyan)',
                    background: 'var(--color-brand-cyan-dim)',
                    border: '1px solid color-mix(in srgb, var(--color-brand-cyan) 25%, transparent)',
                    borderRadius: '0.25rem',
                    padding: '0.25rem 0.5rem',
                  }}>
                    B-{String(h.holeNumber).padStart(2, '0')}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {h.ceiling ? `T:${h.ceiling}m` : ''}
                    {h.ceiling && h.floor ? ' · ' : ''}
                    {h.floor   ? `P:${h.floor}m`   : ''}
                    {!h.ceiling && !h.floor ? 'Sin T/P' : ''}
                  </span>
                </div>

                {/* Right: depth + delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-brand-amber)' }}>
                    {h.depth.toFixed(1)} m
                  </span>
                  <button
                    onClick={() => setPendingDelete(h.holeId)}
                    title="Eliminar barreno"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-faint)',
                      padding: '0.25rem',
                      borderRadius: '0.25rem',
                      transition: 'color 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-faint)'}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {pendingDelete && targetHole && (
        <ConfirmModal
          title="Eliminar barreno"
          rows={deleteRows}
          onConfirm={handleDeleteConfirm}
          onCorrect={() => setPendingDelete(null)}
          danger
          confirmLabel="Eliminar"
          correctLabel="Cancelar"
        />
      )}
    </>
  )
}