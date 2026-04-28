import { useEffect, useState } from "react";
import { createClientId } from "../lib/ids";
import { getTodayDateKey } from "../lib/datetime";
import { showToast } from "./Toast";
import FrozenField from "./FronzenField";
import { blastRepository } from "../di/container";

const SHIFTS = ["DIA", "NOCHE"];

function today() {
  return getTodayDateKey("America/Bogota");
}

function getSign(elev) {
  return String(elev).startsWith("-") ? "-" : "+";
}

function getAbs(elev) {
  return String(elev).replace(/^[+-]/, "");
}

function emptyForm() {
  return {
    operatorName: "",
    equipment: "",
    date: today(),
    shift: "DIA",
    blastId: "",
    diameter: "",
    elevation: "",
    pattern: "",
  };
}

function normalizeElevation(value) {
  return value.replace(/^[+-]$/, "").trim() ? value.trim() : null;
}

function normalizeShift(shift) {
  if (!shift) return emptyForm();

  return {
    operatorName: shift.operatorName || "",
    equipment: shift.equipment || "",
    date: shift.date || today(),
    shift: shift.shiftType || "DIA",
    blastId: shift.blastId || "",
    diameter: shift.diameter ?? "",
    elevation: shift.elevation || "",
    pattern: shift.pattern || "",
  };
}

export default function ShiftHeader({ onFrozen, initialShift = null }) {
  const [frozen, setFrozen] = useState(Boolean(initialShift));
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => normalizeShift(initialShift));
  const [errors, setErrors] = useState({});
  const [blasts, setBlasts] = useState([]);
  const [loadingBlasts, setLoadingBlasts] = useState(true);
  const [selectedBlastData, setSelectedBlastData] = useState(null);

  const active = "border-orange-500 bg-orange-100 text-orange-600";
  const idle = "border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200";

  // Load incomplete blasts on mount
  useEffect(() => {
    let active = true;

    const loadBlasts = async () => {
      try {
        const data = await blastRepository.fetchIncompleteBlasts();
        if (active) {
          setBlasts(data);
        }
      } catch (error) {
        console.error("Error loading blasts:", error);
      } finally {
        if (active) {
          setLoadingBlasts(false);
        }
      }
    };

    loadBlasts();

    return () => {
      active = false;
    };
  }, []);

  // Load blast data when blastId changes (for frozen view or when selected)
  useEffect(() => {
    let active = true;

    const loadBlastData = async () => {
      if (!form.blastId) {
        setSelectedBlastData(null);
        return;
      }

      // First try to find in loaded blasts
      const found = blasts.find((b) => b.id === form.blastId);
      if (found) {
        if (active) {
          setSelectedBlastData(found);
        }
        return;
      }

      // If not found and frozen, try to fetch from database
      if (frozen) {
        try {
          const data = await blastRepository.fetchBlastById(form.blastId);
          if (active && data) {
            setSelectedBlastData(data);
          }
        } catch (error) {
          console.error("Error loading blast data:", error);
        }
      }
    };

    loadBlastData();

    return () => {
      active = false;
    };
  }, [form.blastId, frozen, blasts]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (initialShift) {
        setForm(normalizeShift(initialShift));
        setFrozen(true);
        setErrors({});
        return;
      }

      setForm(emptyForm());
      setFrozen(false);
      setErrors({});
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialShift]);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: false }));
  }

  const required = ["operatorName", "equipment", "blastId"];
  const isValid = required.every((k) => form[k]?.toString().trim());

  function validate() {
    const errs = {};

    if (
      form.pattern.trim() &&
      !/^\d+(\.\d+)?x\d+(\.\d+)?$/i.test(form.pattern.trim())
    ) {
      errs.pattern = true;
    }

    required.forEach((k) => {
      if (!form[k]?.toString().trim()) errs[k] = true;
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleConfirm() {
    if (!validate()) return;

    setSaving(true);
    try {
      const elevation = normalizeElevation(form.elevation);

      const shiftPayload = {
        shiftId: createClientId(),
        operatorName: form.operatorName.trim(),
        equipment: form.equipment.trim(),
        date: form.date,
        shiftType: form.shift,
        blastId: form.blastId,
        diameter: form.diameter === "" ? null : parseFloat(form.diameter),
        elevation,
        pattern: form.pattern.trim() || null,
        synced: false,
      };

      setForm(normalizeShift(shiftPayload));
      setFrozen(true);
      showToast("Turno iniciado");
      await onFrozen(shiftPayload);
    } catch {
      showToast("Error al iniciar turno");
    } finally {
      setSaving(false);
    }
  }

  if (frozen) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div
            className="dot animate-pulse"
            style={{ background: "var(--color-brand-emerald)" }}
          />
          <span className="section-title">Turno activo</span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: "0.625rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--color-brand-emerald)",
            }}
          >
            BLOQUEADO
          </span>
        </div>
        <div
          style={{
            padding: "1rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <FrozenField label="Operador" value={form.operatorName} />
          <FrozenField label="Equipo" value={form.equipment} />
          <FrozenField
            label="Ubicación"
            value={selectedBlastData?.location || ""}
          />
          <FrozenField label="Fecha" value={form.date} />
          <FrozenField label="Turno" value={form.shift} />
          <FrozenField
            label="# Voladura"
            value={selectedBlastData?.blastCode || ""}
          />
          <FrozenField
            label="Diámetro"
            value={form.diameter !== "" ? form.diameter : ""}
          />
          <FrozenField
            label="Cota"
            value={form.elevation ? form.elevation + " m" : ""}
          />
          <FrozenField label="Patrón" value={form.pattern} />
        </div>
      </div>
    );
  }

  return (
    <div className="section-card">
      <div className="section-header">
        <div
          className="dot"
          style={{ background: "var(--color-brand-amber)" }}
        />
        <span className="section-title">Datos del turno</span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "0.625rem",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Se congela al iniciar
        </span>
      </div>

      <div
        style={{
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <button
          className="btn-primary"
          style={{ marginTop: "0.25rem" }}
          onClick={handleConfirm}
          disabled={saving || !isValid || loadingBlasts}
        >
          {saving ? "Iniciando..." : "Iniciar turno"}
        </button>

        <div>
          <label className="field-label">Nombre operador *</label>
          <input
            className={`field-input${errors.operatorName ? " field-input--error" : ""}`}
            type="text"
            placeholder="Ej. Juan Rodríguez"
            value={form.operatorName}
            onChange={(e) => set("operatorName", e.target.value)}
            autoComplete="name"
          />
          {errors.operatorName && (
            <p
              style={{
                marginTop: "0.25rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.625rem",
                color: "var(--color-danger)",
              }}
            >
              Requerido
            </p>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <div>
            <label className="field-label">Equipo *</label>
            <input
              className={`field-input${errors.equipment ? " field-input--error" : ""}`}
              type="number"
              placeholder="1234"
              value={form.equipment}
              onChange={(e) => set("equipment", e.target.value)}
            />
            {errors.equipment && (
              <p
                style={{
                  marginTop: "0.25rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.625rem",
                  color: "var(--color-danger)",
                }}
              >
                Requerido
              </p>
            )}
          </div>
          <div>
            <label className="field-label">Fecha</label>
            <input
              className="field-input"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <div>
            <label className="field-label"># Voladura *</label>
            <select
              className={`field-input${errors.blastId ? " field-input--error" : ""}`}
              value={form.blastId}
              onChange={(e) => set("blastId", e.target.value)}
              disabled={loadingBlasts}
            >
              <option value="">
                {loadingBlasts
                  ? "Cargando voladuras..."
                  : "Selecciona una voladura"}
              </option>
              {blasts.map((blast) => (
                <option key={blast.id} value={blast.id}>
                  {blast.blastCode}
                </option>
              ))}
            </select>
            {errors.blastId && (
              <p
                style={{
                  marginTop: "0.25rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.625rem",
                  color: "var(--color-danger)",
                }}
              >
                Requerido
              </p>
            )}
          </div>
          <div>
            <label className="field-label">Ubicación</label>
            <div
              className="field-input"
              style={{
                background: "var(--color-surface-2)",
                color: "var(--color-text-muted)",
                cursor: "default",
                display: "flex",
                alignItems: "center",
              }}
            >
              {selectedBlastData?.location || "—"}
            </div>
          </div>
        </div>

        <div>
          <label className="field-label">Turno</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {SHIFTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("shift", s)}
                className={`flex-1 px-3 py-3 text-xs uppercase tracking-wide rounded border transition-all font-mono ${form.shift === s ? active : idle}`}
              >
                {s === "DIA" ? "Día" : "Noche"}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <div>
            <label className="field-label">Diámetro</label>
            <input
              className="field-input"
              type="number"
              placeholder="89"
              inputMode="decimal"
              value={form.diameter}
              onChange={(e) => set("diameter", e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Cota (m)</label>
            <div className="flex items-center border border-(--color-border-default) rounded-lg gap-0 overflow-hidden">
              <div
                title="Cambiar signo"
                style={{ minWidth: "3.5rem" }}
                onClick={() => {
                  const sign = getSign(form.elevation);
                  const abs = getAbs(form.elevation);
                  set("elevation", (sign === "+" ? "-" : "+") + abs);
                }}
                className="flex items-center justify-center rounded-tl-lg rounded-bl-lg px-3 py-3 font-mono font-bold transition-all select-none rounded-l-none border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <span className="scale-250 border-none">
                  {getSign(form.elevation) === "+" ? "+" : "-"}
                </span>
              </div>
              <input
                className="field-input border-none rounded-l-none bg-color-surface-1"
                type="number"
                placeholder="10"
                inputMode="decimal"
                step="0.1"
                min="0"
                value={getAbs(form.elevation)}
                onChange={(e) => {
                  const abs = e.target.value.replace(/^-/, ""); // bloquea negativo nativo
                  set("elevation", getSign(form.elevation) + abs);
                }}
              />
            </div>
          </div>
          <div>
            <label className="field-label">Patrón</label>
            <input
              className={`field-input${errors.pattern ? " field-input--error" : ""}`}
              type="text"
              placeholder="3x3"
              value={form.pattern}
              onChange={(e) => set("pattern", e.target.value)}
            />
            {errors.pattern && (
              <p
                style={{
                  marginTop: "0.25rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.625rem",
                  color: "var(--color-danger)",
                }}
              >
                Formato: NxN (EJ: 3x3 o 3.5x3.5)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
