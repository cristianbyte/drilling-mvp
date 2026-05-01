import { useState } from "react";
import SupervisorCargaUploadTab from "./SupervisorCargaUploadTab";

export default function SupervisorCargaExcelModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("upload");
  const tabs = [
    ["upload", "Carga"],
    ["export", "Exporta"],
  ];

  return (
    <div
      className="backdrop-enter fixed inset-0 z-60 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-surface-base)_72%,transparent)] p-3 backdrop-blur-[6px] sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-enter flex h-full max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-(--radius-card) border border-(--color-border-default) bg-(--color-surface-1)">
        <div className="flex items-center justify-between gap-3 border-b border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-surface-2)_65%,transparent)] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="section-title">Excel</div>
            <div className="rounded-full border border-(--color-border-subtle) bg-(--color-surface-base) px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-(--color-text-faint)">
              {activeTab === "upload" ? "Carga" : "Exporta"}
            </div>
          </div>
          <button
            type="button"
            className="btn-correct flex-none px-3 py-2"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-2 border-b border-(--color-border-subtle)">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`border-r border-(--color-border-subtle) px-3 py-2 font-mono text-[0.72rem] uppercase tracking-[0.08em] last:border-r-0 ${
                activeTab === key
                  ? "bg-(--color-brand-cyan-dim) text-(--color-brand-cyan)"
                  : "bg-(--color-surface-base) text-(--color-text-muted)"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {activeTab === "upload" ? (
            <SupervisorCargaUploadTab />
          ) : (
            <div className="p-4 sm:p-5">
              <div className="rounded-(--radius-card) border border-(--color-border-subtle) bg-(--color-surface-base) p-4 font-mono text-[0.72rem] uppercase tracking-[0.08em] text-(--color-text-faint)">
                Pendiente
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
