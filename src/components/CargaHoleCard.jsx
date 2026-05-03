function formatValue(value) {
  return value ?? "-";
}

const PLANNED_FIELDS = [
  { key: "plannedDepth", label: "Prof. D." },
  { key: "plannedEmulsion", label: "Emul. T. D." },
  { key: "plannedStemmingInitial", label: "Ret. I." },
  { key: "plannedStemmingFinal", label: "Ret. F. D." },
];

export default function CargaHoleCard({ draft, hasData, hole, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(hole)}
      className={`rounded-[0.75rem] border px-4 py-4 text-left transition-colors ${
        hasData
          ? "border-(--color-brand-cyan) bg-(--color-brand-cyan-dim) text-(--color-text-primary)"
          : "border-(--color-border-subtle) bg-(--color-surface-1) text-(--color-text-primary) hover:border-(--color-brand-cyan) hover:bg-(--color-brand-cyan-dim)"
      }`}
    >
      <div className="font-(--font-mono) text-3xl tracking-[0.08em] text-(--color-text-primary)">
        {String(hole.holeNumber).padStart(2, "0")}
      </div>

      <div className="flex flex-col gap-1 font-(--font-mono)">
        {PLANNED_FIELDS.map((field) => (
          <div
            key={field.key}
            className="flex flex-row justify-between rounded-[0.6rem] border border-(--color-border-subtle) bg-(--color-surface-base)/70 p-1"
          >
            <div className="text-[0.5rem] uppercase tracking-[0.12em] text-(--color-text-muted)">
              {field.label}
            </div>
            <div className="text-[0.5rem] text-(--color-text-primary)">
              {formatValue(draft[field.key])}
            </div>
          </div>
        ))}
      </div>
    </button>
  );
}
