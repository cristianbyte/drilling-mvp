import { useEffect, useState } from "react";

function toInputValue(value) {
  return value ?? "";
}

function parseNullableNumber(value) {
  if (value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function LoadHoleModal({ hole, draft, onClose, onSave }) {
  const [localDraft, setLocalDraft] = useState(draft);

  useEffect(() => {
    setLocalDraft(draft);
  }, [draft]);

  function handleChange(field, value) {
    setLocalDraft((current) => ({
      ...current,
      [field]: parseNullableNumber(value),
    }));
  }

  function handleSave() {
    onSave(localDraft);
  }

  return (
    <div
      className="backdrop-enter fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-3 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-enter flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-card)] border border-(--color-border-subtle) bg-(--color-surface-1) shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-(--color-border-subtle) px-4 py-4 sm:px-5">
          <div>
            <p className="font-(--font-mono) text-[0.625rem] uppercase tracking-[0.18em] text-(--color-text-muted)">
              Barreno
            </p>
            <h2 className="mt-1 text-lg text-(--color-text-primary)">
              {String(hole.holeNumber).padStart(2, "0")}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-btn)] border border-(--color-border-default) px-3 py-2 font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.12em] text-(--color-text-muted) transition-colors hover:border-(--color-border-strong) hover:text-(--color-text-primary)"
          >
            Cerrar
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Planned depth</label>
              <input
                type="number"
                value={toInputValue(localDraft.plannedDepth)}
                disabled
                className="field-input cursor-not-allowed bg-(--color-surface-base) text-(--color-text-muted) opacity-100"
                readOnly
              />
            </div>

            <div>
              <label className="field-label">Planned emulsion</label>
              <input
                type="number"
                value={toInputValue(localDraft.plannedEmulsion)}
                disabled
                className="field-input cursor-not-allowed bg-(--color-surface-base) text-(--color-text-muted) opacity-100"
                readOnly
              />
            </div>

            <div>
              <label className="field-label">Planned stemming initial</label>
              <input
                type="number"
                value={toInputValue(localDraft.plannedStemmingInitial)}
                disabled
                className="field-input cursor-not-allowed bg-(--color-surface-base) text-(--color-text-muted) opacity-100"
                readOnly
              />
            </div>

            <div>
              <label className="field-label">Planned stemming final</label>
              <input
                type="number"
                value={toInputValue(localDraft.plannedStemmingFinal)}
                disabled
                className="field-input cursor-not-allowed bg-(--color-surface-base) text-(--color-text-muted) opacity-100"
                readOnly
              />
            </div>

            <div>
              <label className="field-label">Leveling</label>
              <input
                type="number"
                value={toInputValue(localDraft.leveling)}
                onChange={(event) => handleChange("leveling", event.target.value)}
                className="field-input"
              />
            </div>

            <div>
              <label className="field-label">Deck</label>
              <input
                type="number"
                value={toInputValue(localDraft.deck)}
                onChange={(event) => handleChange("deck", event.target.value)}
                className="field-input"
              />
            </div>

            <div>
              <label className="field-label">Emulsion total</label>
              <input
                type="number"
                value={toInputValue(localDraft.emulsionTotal)}
                onChange={(event) =>
                  handleChange("emulsionTotal", event.target.value)
                }
                className="field-input"
              />
            </div>

            <div>
              <label className="field-label">Stemming final</label>
              <input
                type="number"
                value={toInputValue(localDraft.stemmingFinal)}
                onChange={(event) =>
                  handleChange("stemmingFinal", event.target.value)
                }
                className="field-input"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-(--color-border-subtle) px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={handleSave} className="btn-primary">
              Guardar
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
