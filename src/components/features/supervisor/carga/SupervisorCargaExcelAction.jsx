import ExportExcelIcon from "../../../../assets/exportExcelIcon.svg";

export default function SupervisorCargaExcelAction({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Excel de carga"
      className="flex items-center cursor-pointer justify-center rounded-(--radius-btn) border-2 border-(--color-brand-cyan) p-[0.35rem] text-(--color-brand-cyan) transition-all"
    >
      <ExportExcelIcon />
    </button>
  );
}
