import { useEffect, useRef, useState } from "react";
import { showToast } from "./Toast";

function parseOptionalNumber(value) {
  if (value === "") return null;
  const numeric = parseFloat(value);
  return Number.isNaN(numeric) ? null : numeric;
}

export default function HoleEntry({
  availableHoles = [],
  loadingHoles = false,
  onSaved,
}) {
  const [form, setForm] = useState({
    selectedHoleId: "",
    depth: "",
    ceiling: "",
    floor: "",
  });
  const [error, setError] = useState({ selectedHoleId: false, depth: false });
  const [saving, setSaving] = useState(false);
  const depthRef = useRef(null);

  const selectedHole =
    availableHoles.find((hole) => hole.id === form.selectedHoleId) ?? null;

  useEffect(() => {
    depthRef.current?.focus();
  }, []);

  useEffect(() => {
    if (
      form.selectedHoleId &&
      !availableHoles.some((hole) => hole.id === form.selectedHoleId)
    ) {
      setForm((current) => ({ ...current, selectedHoleId: "" }));
    }
  }, [availableHoles, form.selectedHoleId]);

  function setField(key, val) {
    setForm((current) => ({ ...current, [key]: val }));
    setError((current) => ({ ...current, [key]: false }));
  }

  function validate() {
    const nextError = {
      selectedHoleId: !form.selectedHoleId,
      depth: !parseFloat(form.depth) || parseFloat(form.depth) <= 0,
    };

    setError(nextError);

    if (nextError.selectedHoleId || nextError.depth) {
      if (nextError.depth) {
        depthRef.current?.focus();
      }
      return false;
    }

    return true;
  }

  const isValid = Boolean(form.selectedHoleId) && parseFloat(form.depth) > 0;

  async function handleSubmit() {
    if (!validate() || !selectedHole) return;

    const hole = {
      holeId: selectedHole.id,
      remoteHoleId: selectedHole.id,
      holeNumber: selectedHole.holeNumber,
      depth: parseFloat(form.depth),
      ceiling: parseOptionalNumber(form.ceiling),
      floor: parseOptionalNumber(form.floor),
      synced: false,
    };

    setSaving(true);
    try {
      await onSaved(hole);
      setForm({ selectedHoleId: "", depth: "", ceiling: "", floor: "" });
      showToast(
        `Barreno ${String(selectedHole.holeNumber).padStart(2, "0")} guardado`,
      );
      setTimeout(() => depthRef.current?.focus(), 80);
    } catch {
      showToast("Error al guardar, reintenta");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") handleSubmit();
  }

  return (
    <div className="section-card w-full min-w-0 max-w-full">
      <div className="section-header">
        <div className="dot bg-(--color-brand-cyan)" />
        <span className="section-title">Registro de barreno</span>
      </div>

      <div className="flex flex-col gap-3 p-4 sm:gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Profundidad (m) *</label>
            <input
              ref={depthRef}
              className={`field-input font-(--font-mono) text-2xl sm:text-[1.5rem] ${error.depth ? "field-input--error" : ""}`}
              type="number"
              placeholder="0.0"
              inputMode="decimal"
              step="0.1"
              value={form.depth}
              onChange={(event) => setField("depth", event.target.value)}
              onKeyDown={handleKeyDown}
            />
            {error.depth && (
              <p className="mt-1 font-(--font-mono) text-[0.625rem] text-(--color-danger)">
                Profundidad requerida y mayor a 0
              </p>
            )}
          </div>

          <div>
            <label className="field-label">Barreno *</label>
            <select
              className={`field-input ${error.selectedHoleId ? "field-input--error" : ""}`}
              value={form.selectedHoleId}
              onChange={(event) =>
                setField("selectedHoleId", event.target.value)
              }
              disabled={loadingHoles || !availableHoles.length}
            >
              <option value="">
                {loadingHoles
                  ? "Cargando barrenos..."
                  : availableHoles.length
                    ? "Seleccionar"
                    : "Sin barrenos disponibles"}
              </option>
              {availableHoles.map((hole) => (
                <option key={hole.id} value={hole.id}>
                  B-{String(hole.holeNumber).padStart(2, "0")}
                </option>
              ))}
            </select>
            {error.selectedHoleId && (
              <p className="mt-1 font-(--font-mono) text-[0.625rem] text-(--color-danger)">
                Barreno requerido
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Techo (m)</label>
            <input
              className="field-input"
              type="number"
              min="0"
              placeholder="0.0"
              inputMode="decimal"
              step="0.1"
              value={form.ceiling}
              onChange={(event) => setField("ceiling", event.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div>
            <label className="field-label">Piso (m)</label>
            <input
              className="field-input"
              type="number"
              min="0"
              placeholder="0.0"
              inputMode="decimal"
              step="0.1"
              value={form.floor}
              onChange={(event) => setField("floor", event.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={saving || loadingHoles || !isValid}
        >
          {saving ? "Guardando..." : "Guardar barreno"}
        </button>
      </div>
    </div>
  );
}
