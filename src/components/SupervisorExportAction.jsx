import ExportExcelIcon from "../assets/exportExcelIcon.svg";

export default function SupervisorExportAction({
  onClick,
  disabled = false,
  title,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={
        title || (disabled ? "No hay fechas disponibles" : "Exportar a Excel")
      }
      className={`flex items-center justify-center rounded-(--radius-btn) border-2 p-[0.35rem] transition-all ${
        disabled
          ? "cursor-not-allowed border-(--color-border-default) text-(--color-text-faint)"
          : "cursor-pointer border-(--color-brand-emerald) text-(--color-brand-emerald)"
      }`}
    >
      <ExportExcelIcon />
    </button>
  );
}
