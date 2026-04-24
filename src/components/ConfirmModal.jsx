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
  confirmLabel = "Confirmar",
  correctLabel = "Corregir",
}) {
  return (
    /* Backdrop */
    <div
      className="backdrop-enter fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in srgb, var(--color-surface-base) 75%, transparent)] backdrop-blur-xs p-[0_0_env(safe-area-inset-bottom,0)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCorrect();
      }}
    >
      {/* Sheet */}
      <div className="modal-enter w-full max-w-[120] bg-surface-1 border border-border-default rounded-t-[--radius-card] overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center gap-2 p-[0.875rem_1rem] border-b border-border-subtle bg-[color-mix(in srgb, var(--color-surface-2) 70%, transparent)]">
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-text-muted">
            {title}
          </span>
          <span className="ml-auto font-mono text-[0.625rem] uppercase tracking-[0.12em] text-brand-amber">
            Verificar antes de enviar
          </span>
        </div>

        {/* Summary rows */}
        <div className="p-[0.25rem_1rem]">
          {rows.map(({ key, val, accent }) => (
            <div key={key} className="confirm-row">
              <span className="confirm-key">{key}</span>
              <span
                className={`confirm-val${accent ? " confirm-val--accent" : ""}`}
              >
                {val ?? "—"}
              </span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 p-4 border-t border-border-subtle">
          <button
            className={danger ? "btn-danger" : "btn-confirm"}
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
  );
}
