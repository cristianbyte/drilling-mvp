import { useEffect, useMemo, useState } from "react";

const MONTHS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

function getDaysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function buildYearOptions(initialDate) {
  const currentYear = Number(initialDate.slice(0, 4));
  return Array.from({ length: 6 }, (_, index) =>
    String(currentYear - index),
  ).map((value) => ({
    value,
    label: value,
  }));
}

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select
        className="field-input"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <option value="">Seleccionar</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ExportDayModal({
  initialDate,
  onClose,
  onDownload,
  exporting = false,
  feedback = "",
}) {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  const years = useMemo(() => buildYearOptions(initialDate), [initialDate]);
  const days = useMemo(
    () =>
      Array.from({ length: getDaysInMonth(year, month) }, (_, index) => {
        const value = String(index + 1).padStart(2, "0");
        return { value, label: value };
      }),
    [month, year],
  );

  useEffect(() => {
    setYear(initialDate.slice(0, 4));
    setMonth(initialDate.slice(5, 7));
    setDay(initialDate.slice(8, 10));
  }, [initialDate]);

  useEffect(() => {
    if (!day) return;
    const maxDay = getDaysInMonth(year, month);
    if (Number(day) > maxDay) {
      setDay(String(maxDay).padStart(2, "0"));
    }
  }, [day, month, year]);

  const selectedDate = year && month && day ? `${year}-${month}-${day}` : "";
  const disabled = exporting || !selectedDate;

  return (
    <div
      className="backdrop-enter fixed inset-0 z-60 flex items-center justify-center p-4 bg-[color-mix(in srgb, var(--color-surface-base) 72%, transparent)] backdrop-blur-[6px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-enter w-full max-w-140 bg-(--color-surface-1) border border-(--color-border-default) rounded-(--radius-card) overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-[1rem_1.25rem] border-b border-(--color-border-subtle) bg-[color-mix(in srgb, var(--color-surface-2) 65%, transparent)]">
          <div>
            <div className="section-title">Exportar registros</div>
            <div className="mt-[0.35rem] font-mono text-[0.75rem] text-(--color-text-muted)">
              {/* Consulta base de datos por fecha exacta y descarga archivo Excel. */}
              Requiere conexión a internet | El proceso puede tardar unos
              segundos dependiendo la carga del día seleccionado.
            </div>
          </div>
          <button
            type="button"
            className="btn-correct flex-none p-[0.65rem_0.9rem]"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <SelectField
              label="Año"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              options={years}
            />
            <SelectField
              label="Mes"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              options={MONTHS}
            />
            <SelectField
              label="Día"
              value={day}
              onChange={(event) => setDay(event.target.value)}
              options={days}
            />
          </div>

          <div className="font-mono text-[0.7rem] text-(--color-text-muted) uppercase tracking-[0.08em]">
            {selectedDate
              ? `Fecha seleccionada: ${selectedDate}`
              : "Selecciona fecha para descargar"}
          </div>

          {feedback ? (
            <div className="font-mono text-[0.75rem] text-(--color-brand-amber)">
              {feedback}
            </div>
          ) : null}

          <button
            type="button"
            className="btn-primary"
            disabled={disabled}
            onClick={() => onDownload(selectedDate)}
          >
            {exporting ? "Consultando y generando..." : "Descargar XLSX"}
          </button>
        </div>
      </div>
    </div>
  );
}
