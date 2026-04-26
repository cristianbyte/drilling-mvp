/**
 * ConfirmModal
 *
 * Props:
 *   title string
 *   rows { key, val, accent? }[]
 *   onConfirm fn
 *   onCorrect fn
 *   danger bool
 *   confirmLabel string
 *   correctLabel string
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
    <div
      className="backdrop-enter fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      style={{ background: 'transparent' }}
      onClick={event => {
        if (event.target === event.currentTarget) onCorrect()
      }}
    >
      <div
        className="modal-enter w-full max-w-md overflow-hidden border shadow-2xl"
        style={{
          background: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-default)',
          borderRadius: 'var(--radius-card)',
        }}
      >
        <div
          className="flex items-center justify-between gap-4 border-b px-5 py-4"
          style={{
            borderColor: 'var(--color-border-subtle)',
            background: 'color-mix(in srgb, var(--color-surface-2) 65%, transparent)',
          }}
        >
          <div>
            <p className="section-title">{title}</p>
            <p
              className="mt-1 text-xs uppercase tracking-[0.12em]"
              style={{
                color: danger ? 'var(--color-danger)' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {danger ? 'Accion permanente' : 'Verifica antes de continuar'}
            </p>
          </div>
          <button
            type="button"
            className="btn-correct w-auto! px-4 py-2"
            onClick={onCorrect}
          >
            Cerrar
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            {rows.map(({ key, val, accent }) => (
              <div key={key} className="confirm-row">
                <span className="confirm-key">{key}</span>
                <span className={`confirm-val${accent ? ' confirm-val--accent' : ''}`}>
                  {val ?? '—'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className={danger ? 'btn-danger' : 'btn-primary'}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onCorrect}
            >
              {correctLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
