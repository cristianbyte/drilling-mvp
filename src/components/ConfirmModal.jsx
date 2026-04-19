/**
 * ConfirmModal
 *
 * Props:
 *   title    string             — modal heading
 *   rows     { key, val, accent? }[]  — summary rows
 *   onConfirm  fn               —  button: confirm
 *   onCorrect  fn               —  button: go back and fix
 *   danger   bool               — swap confirm to red (for delete)
 *   confirmLabel  string        — override confirm button text
 *   correctLabel  string        — override correct button text
 */
export default function ConfirmModal({
  title,
  rows = [],
  onConfirm,
  onCorrect,
  danger = false,
  confirmLabel = 'Confirmar',
  correctLabel = 'Corregir',
}) {
  return (
    /* Backdrop */
    <div
      className="backdrop-enter"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'color-mix(in srgb, var(--color-surface-base) 75%, transparent)',
        backdropFilter: 'blur(4px)',
        padding: '0 0 env(safe-area-inset-bottom, 0)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCorrect() }}
    >
      {/* Sheet */}
      <div
        className="modal-enter"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--color-surface-1)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-card) var(--radius-card) 0 0',
          overflow: 'hidden',
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.875rem 1rem',
            borderBottom: '1px solid var(--color-border-subtle)',
            background: 'color-mix(in srgb, var(--color-surface-2) 70%, transparent)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--color-text-muted)',
            }}
          >
            {title}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--color-brand-amber)',
            }}
          >
            Verificar antes de enviar
          </span>
        </div>

        {/* Summary rows */}
        <div style={{ padding: '0.25rem 1rem' }}>
          {rows.map(({ key, val, accent }) => (
            <div key={key} className="confirm-row">
              <span className="confirm-key">{key}</span>
              <span className={`confirm-val${accent ? ' confirm-val--accent' : ''}`}>
                {val ?? '—'}
              </span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            padding: '1rem',
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
                    <button
            className={danger ? 'btn-danger' : 'btn-confirm'}
            onClick={onConfirm}
          >
            {confirmLabel} →
          </button>
          <button className="btn-correct" onClick={onCorrect}>
            ← {correctLabel}
          </button>


        </div>
      </div>
    </div>
  )
}