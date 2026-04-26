import { useEffect, useState } from "react";

function parseOptionalNumber(value) {
  if (value === "") return null;
  const numeric = parseFloat(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function buildForm(hole) {
  return {
    holeNumber: String(hole?.holeNumber ?? ""),
    depth: String(hole?.depth ?? ""),
    ceiling: String(hole?.ceiling ?? ""),
    floor: String(hole?.floor ?? ""),
  };
}

export default function EditHoleModal({ hole, onClose, onSave }) {
  const [form, setForm] = useState(() => buildForm(hole));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(buildForm(hole));
    setError("");
  }, [hole]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function validate() {
    const depth = Number(form.depth);
    const ceiling = form.ceiling === "" ? null : Number(form.ceiling);
    const floor = form.floor === "" ? null : Number(form.floor);

    if (!form.depth || Number.isNaN(depth) || depth <= 0)
      return "Profundidad debe ser mayor a 0.";
    if (ceiling !== null && (Number.isNaN(ceiling) || ceiling < 0))
      return "Techo debe ser 0 o mayor.";
    if (floor !== null && (Number.isNaN(floor) || floor < 0))
      return "Piso debe ser 0 o mayor.";

    return "";
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      await onSave({
        depth: parseFloat(form.depth),
        ceiling: parseOptionalNumber(form.ceiling),
        floor: parseOptionalNumber(form.floor),
      });
      onClose();
    } catch (submitError) {
      setError(submitError?.message || "No se pudo guardar cambios.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="backdrop-enter fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{
        background:
          "color-mix(in srgb, var(--color-surface-base) 72%, transparent)",
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="modal-enter w-full max-w-md overflow-hidden border shadow-2xl"
        style={{
          background: "var(--color-surface-1)",
          borderColor: "var(--color-border-default)",
          borderRadius: "var(--radius-card)",
        }}
      >
        <div
          className="flex items-center justify-between gap-4 border-b px-5 py-4"
          style={{
            borderColor: "var(--color-border-subtle)",
            background:
              "color-mix(in srgb, var(--color-surface-2) 65%, transparent)",
          }}
        >
          <div>
            <p className="section-title">Editar barreno</p>
            <p
              className="mt-1 text-xs uppercase tracking-[0.12em]"
              style={{
                color: "var(--color-text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Ajuste operador
            </p>
          </div>
          <button
            type="button"
            className="btn-correct w-auto! px-4 py-2"
            onClick={onClose}
            disabled={saving}
          >
            Cerrar
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label"># Barreno</label>
              <input
                className="field-input opacity-70"
                value={form.holeNumber}
                disabled
              />
            </div>
            <div>
              <label className="field-label">Profundidad (m)</label>
              <input
                className="field-input"
                type="number"
                step="0.1"
                inputMode="decimal"
                value={form.depth}
                onChange={(event) => setField("depth", event.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Techo (m)</label>
              <input
                className="field-input"
                type="number"
                step="0.1"
                min="0"
                inputMode="decimal"
                value={form.ceiling}
                onChange={(event) => setField("ceiling", event.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Piso (m)</label>
              <input
                className="field-input"
                type="number"
                step="0.1"
                min="0"
                inputMode="decimal"
                value={form.floor}
                onChange={(event) => setField("floor", event.target.value)}
              />
            </div>
          </div>

          {error ? (
            <p
              className="text-xs uppercase tracking-[0.08em]"
              style={{
                color: "var(--color-danger)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
