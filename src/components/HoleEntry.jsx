import { useEffect, useRef, useState } from "react";
import { showToast } from "./Toast";

function parseOptionalNumber(value) {
  if (value === "") return null;
  const numeric = parseFloat(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function formatHoleNumber(holeNumber) {
  return String(holeNumber).padStart(2, "0");
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
  const [holeQuery, setHoleQuery] = useState("");
  const [isHoleMenuOpen, setIsHoleMenuOpen] = useState(false);
  const [activeHoleIndex, setActiveHoleIndex] = useState(0);
  const depthRef = useRef(null);

  const selectedHole =
    availableHoles.find((hole) => hole.id === form.selectedHoleId) ?? null;
  const filteredHoles = availableHoles.filter((hole) => {
    const formattedHoleNumber = formatHoleNumber(hole.holeNumber);
    const normalizedQuery = holeQuery.trim();

    if (!normalizedQuery) return true;

    return (
      formattedHoleNumber.includes(normalizedQuery) ||
      String(hole.holeNumber).includes(normalizedQuery)
    );
  });

  useEffect(() => {
    depthRef.current?.focus();
  }, []);

  useEffect(() => {
    if (
      form.selectedHoleId &&
      !availableHoles.some((hole) => hole.id === form.selectedHoleId)
    ) {
      setForm((current) => ({ ...current, selectedHoleId: "" }));
      setHoleQuery("");
    }
  }, [availableHoles, form.selectedHoleId]);

  useEffect(() => {
    setHoleQuery(selectedHole ? formatHoleNumber(selectedHole.holeNumber) : "");
  }, [selectedHole]);

  useEffect(() => {
    setActiveHoleIndex(0);
  }, [holeQuery]);

  function setField(key, val) {
    setForm((current) => ({ ...current, [key]: val }));
    setError((current) => ({ ...current, [key]: false }));
  }

  function selectHole(hole) {
    setField("selectedHoleId", hole.id);
    setHoleQuery(formatHoleNumber(hole.holeNumber));
    setIsHoleMenuOpen(false);
    setActiveHoleIndex(0);
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
      setHoleQuery("");
      setIsHoleMenuOpen(false);
      showToast(
        `Barreno ${formatHoleNumber(selectedHole.holeNumber)} guardado`,
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

  function handleHoleInputChange(event) {
    setHoleQuery(event.target.value);
    setField("selectedHoleId", "");
    setIsHoleMenuOpen(true);
  }

  function handleHoleInputKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!filteredHoles.length) return;
      setIsHoleMenuOpen(true);
      setActiveHoleIndex((current) =>
        current >= filteredHoles.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!filteredHoles.length) return;
      setIsHoleMenuOpen(true);
      setActiveHoleIndex((current) =>
        current <= 0 ? filteredHoles.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      if (isHoleMenuOpen && filteredHoles[activeHoleIndex]) {
        event.preventDefault();
        selectHole(filteredHoles[activeHoleIndex]);
        return;
      }

      handleSubmit();
      return;
    }

    if (event.key === "Escape") {
      setIsHoleMenuOpen(false);
    }
  }

  function handleHoleInputBlur() {
    window.setTimeout(() => {
      setIsHoleMenuOpen(false);
      setHoleQuery(
        selectedHole ? formatHoleNumber(selectedHole.holeNumber) : "",
      );
    }, 120);
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
            <div className="relative">
              <input
                className={`field-input font-(--font-mono) ${error.selectedHoleId ? "field-input--error" : ""}`}
                type="text"
                placeholder={
                  loadingHoles
                    ? "Cargando barrenos..."
                    : availableHoles.length
                      ? "00"
                      : "Sin barrenos disponibles"
                }
                value={holeQuery}
                onChange={handleHoleInputChange}
                onFocus={() => setIsHoleMenuOpen(true)}
                onBlur={handleHoleInputBlur}
                onKeyDown={handleHoleInputKeyDown}
                disabled={loadingHoles || !availableHoles.length}
                inputMode="numeric"
                autoComplete="off"
                role="combobox"
                aria-expanded={isHoleMenuOpen}
                aria-autocomplete="list"
                aria-controls="hole-entry-options"
              />

              {isHoleMenuOpen && !loadingHoles && availableHoles.length > 0 && (
                <div
                  id="hole-entry-options"
                  className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-[var(--radius-input)] border border-(--color-border-default) bg-(--color-surface-2) shadow-lg"
                  role="listbox"
                >
                  {filteredHoles.length ? (
                    filteredHoles.map((hole, index) => {
                      const formattedHoleNumber = formatHoleNumber(
                        hole.holeNumber,
                      );

                      return (
                        <button
                          key={hole.id}
                          type="button"
                          className={`flex w-full items-center justify-between px-3 py-2 text-left font-(--font-mono) text-sm ${
                            index === activeHoleIndex
                              ? "bg-(--color-brand-amber) text-(--color-surface-base)"
                              : "text-(--color-text-primary)"
                          }`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectHole(hole)}
                          onMouseEnter={() => setActiveHoleIndex(index)}
                          role="option"
                          aria-selected={form.selectedHoleId === hole.id}
                        >
                          <span>{formattedHoleNumber}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 font-(--font-mono) text-sm text-(--color-text-muted)">
                      Sin coincidencias
                    </div>
                  )}
                </div>
              )}
            </div>
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
