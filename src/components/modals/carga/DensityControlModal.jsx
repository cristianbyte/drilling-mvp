import { useEffect, useState } from "react";
import { densityControlFields } from "../../../lib/densityControl";
import { normalizeDecimalInput } from "../../../utils/decimal";

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

export default function DensityControlModal({ blast, draft, onClose, onSave }) {
  const [form, setForm] = useState(() =>
    densityControlFields.reduce(
      (current, { key }) => ({
        ...current,
        [key]: toInputValue(draft?.[key]),
      }),
      {},
    ),
  );

  useEffect(() => {
    setForm(
      densityControlFields.reduce(
        (current, { key }) => ({
          ...current,
          [key]: toInputValue(draft?.[key]),
        }),
        {},
      ),
    );
  }, [draft]);

  function handleChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: normalizeDecimalInput(value),
    }));
  }

  function handleSave() {
    onSave({
      ...draft,
      ...densityControlFields.reduce(
        (current, { key }) => ({
          ...current,
          [key]: parseNullableNumber(form[key]),
        }),
        {},
      ),
    });
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
      <div className="modal-enter flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-(--radius-card) border border-(--color-border-subtle) bg-(--color-surface-1) shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-(--color-border-subtle) px-4 py-4 sm:px-5">
          <div>
            <p className="font-(--font-mono) text-xl bold uppercase tracking-[0.18em] text-(--color-text-muted)">
              Control de densidad
            </p>
            {/* <h2 className="mt-1 text-lg text-(--color-text-primary)">
              {blast?.blastCode || "Voladura"}
            </h2> */}
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
          <div className="mb-4 rounded-[0.75rem] border border-(--color-border-subtle) bg-(--color-surface-base) px-4 py-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em] text-(--color-text-muted)">
                  Voladura
                </p>
                <p className="mt-1 text-sm text-(--color-text-primary)">
                  {blast?.blastCode || "-"}
                </p>
              </div>
              <div>
                <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em] text-(--color-text-muted)">
                  Ubicacion
                </p>
                <p className="mt-1 text-sm text-(--color-text-primary)">
                  {blast?.location || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {densityControlFields.map(({ key, label }) => (
              <div key={key}>
                <label className="field-label">{label}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form[key] ?? ""}
                  onChange={(event) => handleChange(key, event.target.value)}
                  className="field-input"
                />
              </div>
            ))}
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
