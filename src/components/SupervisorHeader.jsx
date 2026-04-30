import LiveBadge from "./LiveBadge";
import { formatTime } from "../lib/datetime";

function ExportExcelIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M11.5 21h-4.5a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v5m-5 6h7m-3 -3l3 3l-3 3" />
    </svg>
  );
}

export default function SupervisorHeader({
  accentClassName = "text-(--color-brand-amber)",
  badgeText = null,
  detailLabel = null,
  exportLabel = null,
  hideExport = false,
  lastUpdate,
  onOpenExport,
  selectedDate,
  subtitle = "Dashboard: ultimos 50 registros",
  title = "Supervisor / Perforacion",
  exportDisabled = false,
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-(--color-border-default) bg-(--color-surface-1)/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <div
            className={`font-(--font-mono) text-[0.8125rem] uppercase tracking-[0.08em] ${accentClassName}`}
          >
            {title}
          </div>
          <div className="font-(--font-mono) text-[0.5rem] uppercase tracking-[0.08em] text-(--color-text-faint)">
            {subtitle}
          </div>
          {(exportLabel || selectedDate) && (
            <div className="font-(--font-mono) text-[0.5rem] uppercase tracking-[0.05em] text-(--color-text-faint)">
              {exportLabel || `Exportacion: fecha ${selectedDate}`}
            </div>
          )}
          {detailLabel && (
            <div className="font-(--font-mono) text-[0.5rem] uppercase tracking-[0.05em] text-(--color-text-faint)">
              {detailLabel}
            </div>
          )}
        </div>

        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center gap-1 text-xs">
            <LiveBadge />
            <div className="font-(--font-mono) text-[0.6rem] font-semibold text-(--color-text-faint)">
              {lastUpdate
                ? `Act. ${formatTime(lastUpdate, "America/Bogota", "es-CO", { second: "2-digit" })}`
                : "-"}
            </div>
          </div>

          {badgeText && (
            <div className="rounded-full border border-(--color-border-subtle) bg-(--color-surface-base) px-3 py-2 font-(--font-mono) text-[0.625rem] uppercase tracking-[0.12em] text-(--color-text-muted)">
              {badgeText}
            </div>
          )}

          {!hideExport && (
            <div className="exportExcel">
              <button
                type="button"
                onClick={onOpenExport}
                disabled={exportDisabled}
                title={
                  exportDisabled ? "No hay fechas disponibles" : "Exportar a Excel"
                }
                className={`flex items-center justify-center rounded-(--radius-btn) border-2 p-[0.35rem] transition-all ${
                  exportDisabled
                    ? "cursor-not-allowed border-(--color-border-default) text-(--color-text-faint)"
                    : "cursor-pointer border-(--color-brand-emerald) text-(--color-brand-emerald)"
                }`}
              >
                <ExportExcelIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
