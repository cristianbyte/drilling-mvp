import { getTodayDateKey } from "../lib/datetime";

export default function FrozenField({ label, value }) {
  const display = value == null || value === "" ? "—" : value;
  const warn =
    label === "Fecha" && value && value !== getTodayDateKey("America/Bogota");
  return (
    <div className="flex justify-between items-baseline gap-1 p-1 rounded-lg bg-(--color-border-subtle) border-(--color-border-subtle)">
      <span className="text-[0.6rem] uppercase tracking-[0.08em] text-(--color-text-faint) whitespace-nowrap">
        {label}
      </span>
      <span
        className={`text-xs font-(--font-mono) text-right ${
          warn ? "text-(--color-brand-amber)" : "text-(--color-text-muted)"
        }`}
      >
        {display}
      </span>
    </div>
  );
}
