import { useState } from 'react'
import ConfirmModal from './ConfirmModal'
import { showToast } from './Toast'

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function SyncIcon({ synced }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {synced ? (
        <>
          <path d="M20 6 9 17l-5-5" />
          <path d="M19 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11" />
        </>
      ) : (
        <>
          <path d="M21 12a9 9 0 0 1-15.5 6.4" />
          <path d="M3 12a9 9 0 0 1 15.5-6.4" />
          <path d="M3 16v-4h4" />
          <path d="M21 8v4h-4" />
        </>
      )}
    </svg>
  )
}

function ActionIconButton({ title, onClick, children, color = 'var(--color-text-faint)', hoverColor = color, disabled = false }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={title}
      disabled={disabled}
      style={{
        background: 'none',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        color,
        opacity: disabled ? 0.7 : 1,
        padding: '0.25rem',
        borderRadius: '0.25rem',
        transition: 'color 0.15s',
        display: 'flex',
        alignItems: 'center',
      }}
      onMouseEnter={e => {
        if (!disabled) e.currentTarget.style.color = hoverColor
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = color
      }}
    >
      {children}
    </button>
  )
}

export default function HoleLog({ holes, totalMeters, onDelete, shiftLocation }) {
  const [pendingDelete, setPendingDelete] = useState(null)

  const targetHole = holes.find(h => h.holeId === pendingDelete)

  function handleDeleteConfirm() {
    onDelete(pendingDelete)
    showToast(`Barreno B-${String(targetHole.holeNumber).padStart(2, '0')} eliminado`)
    setPendingDelete(null)
  }

  const deleteRows = targetHole ? [
    { key: '# Barreno', val: `B-${String(targetHole.holeNumber).padStart(2, '0')}`, accent: true },
    { key: 'Ubicación', val: shiftLocation || '—' },
    { key: 'Profundidad', val: targetHole.depth.toFixed(1) + ' m', accent: true },
    { key: 'Techo', val: targetHole.ceiling.toFixed(1) + ' m' },
    { key: 'Piso', val: targetHole.floor.toFixed(1) + ' m' },
  ] : []

  return (
    <>
      <div className="section-card">
        <div className="section-header">
          <div className="dot" style={{ background: 'var(--color-border-strong)' }} />
          <span className="section-title">Registros del turno</span>
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
            [...holes].reverse().map((h, i) => {
              const isSynced = !String(h.holeId || '').startsWith('local-')

              return (
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {shiftLocation || 'Sin ubicación'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        T:{Number(h.ceiling || 0).toFixed(1)}m · P:{Number(h.floor || 0).toFixed(1)}m
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-brand-amber)' }}>
                      {h.depth.toFixed(1)} m
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                      <ActionIconButton
                        title="Editar (próximamente)"
                        disabled
                        color="var(--color-text-faint)"
                      >
                        <EditIcon />
                      </ActionIconButton>
                      <ActionIconButton
                        title={isSynced ? 'Sincronizado' : 'Pendiente de sincronización'}
                        disabled
                        color={isSynced ? 'var(--color-brand-emerald)' : 'var(--color-text-muted)'}
                      >
                        <SyncIcon synced={isSynced} />
                      </ActionIconButton>
                      <ActionIconButton
                        title="Eliminar barreno"
                        onClick={() => setPendingDelete(h.holeId)}
                        color="var(--color-text-faint)"
                        hoverColor="var(--color-danger)"
                      >
                        <TrashIcon />
                      </ActionIconButton>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

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
