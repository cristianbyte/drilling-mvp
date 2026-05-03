import { useState } from "react";
import SupervisorCargaUploadTab from "./SupervisorCargaUploadTab";
import { exportSupervisorCargaToXlsx } from "../lib/exportSupervisorCargaXlsx";

function buildExportState() {
  return {
    status: "Selecciona una voladura lista para exportar.",
    error: "",
    exported: false,
  };
}

export default function SupervisorCargaExcelModal({
  blastFull,
  loading,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("upload");
  const [exportState, setExportState] = useState(buildExportState);
  const tabs = [
    ["upload", "Carga"],
    ["export", "Exporta"],
  ];

  const holeCount = blastFull?.holes?.length ?? 0;
  const canExport = Boolean(blastFull && holeCount > 0 && !loading);
  const exportBadge = loading
    ? "Cargando"
    : canExport
      ? "Listo"
      : "Pendiente";

  function handleExport() {
    if (loading) {
      setExportState({
        status: "Esperando datos de la voladura...",
        error: "",
        exported: false,
      });
      return;
    }

    if (!blastFull) {
      setExportState({
        status: "No hay una voladura seleccionada.",
        error: "Selecciona una voladura antes de exportar.",
        exported: false,
      });
      return;
    }

    try {
      const exportedRows = exportSupervisorCargaToXlsx(blastFull);

      if (!exportedRows) {
        setExportState({
          status: "No hay barrenos para exportar.",
          error: "La voladura seleccionada no tiene datos disponibles.",
          exported: false,
        });
        return;
      }

      setExportState({
        status: `Exportacion completada: ${exportedRows} barrenos.`,
        error: "",
        exported: true,
      });
    } catch (error) {
      console.error("Error exporting supervisor carga Excel:", error);
      setExportState({
        status: "Error de exportacion.",
        error:
          error instanceof Error
            ? error.message
            : "No se pudo generar el archivo.",
        exported: false,
      });
    }
  }

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
              <div className="flex flex-col gap-3">
                <div className="rounded-(--radius-card) border border-dashed border-(--color-border-default) bg-(--color-surface-base) p-4">
                  <div className="flex flex-wrap items-center gap-3 sm:justify-between">
                    <div
                      className={`rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.08em] ${
                        exportState.error
                          ? "border-(--color-danger) bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-(--color-danger)"
                          : canExport
                            ? "border-(--color-brand-emerald) bg-(--color-brand-emerald-dim) text-(--color-brand-emerald)"
                            : "border-(--color-border-subtle) bg-(--color-surface-1) text-(--color-text-faint)"
                      }`}
                    >
                      {exportState.error ? "Error" : exportBadge}
                    </div>
                    <div className="flex-1 rounded-(--radius-card) border border-(--color-border-subtle) bg-(--color-surface-1) px-3 py-2.5 font-mono text-[0.72rem] uppercase tracking-[0.08em] text-(--color-text-faint)">
                      {exportState.status}
                    </div>
                  </div>
                  {exportState.error ? (
                    <div className="mt-3 rounded-(--radius-card) border border-(--color-danger) bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] px-3 py-2.5 font-mono text-[0.72rem] text-(--color-danger)">
                      {exportState.error}
                    </div>
                  ) : null}
                  {exportState.exported ? (
                    <div className="mt-3 rounded-(--radius-card) border border-(--color-brand-emerald) bg-(--color-brand-emerald-dim) px-3 py-2.5 font-mono text-[0.72rem] text-(--color-brand-emerald)">
                      Archivo descargado.
                    </div>
                  ) : null}
                </div>

                <div className="rounded-(--radius-card) border border-(--color-border-subtle) bg-(--color-surface-base) p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <div className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-(--color-text-muted)">
                        Voladura
                      </div>
                      <div className="mt-1 text-sm text-(--color-text-primary)">
                        {blastFull?.blastCode || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-(--color-text-muted)">
                        Ubicacion
                      </div>
                      <div className="mt-1 text-sm text-(--color-text-primary)">
                        {blastFull?.location || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-(--color-text-muted)">
                        Barrenos
                      </div>
                      <div className="mt-1 text-sm text-(--color-text-primary)">
                        {holeCount}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleExport}
                    disabled={!canExport}
                  >
                    Exportar excel
                  </button>
                </div>

                <div className="rounded-(--radius-card) border border-(--color-border-subtle) bg-(--color-surface-base) p-4 font-mono text-[0.72rem] uppercase tracking-[0.08em] text-(--color-text-faint)">
                  El archivo incluye: barreno, lider, datos planificados y datos finales de carga.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
