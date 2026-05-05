import { useRef } from "react";
import CargaHoleCard from "./CargaHoleCard";
import ActionIconButton from "./ActionIconButton";

export default function CargaHolesSection({
  blastHoles,
  buildLoadingDraft,
  cargaBodyHeightClass,
  densityPendingSync,
  hasDraftData,
  hasDensityData,
  holeDrafts,
  holeFilter,
  onOpenDensityControl,
  onSelectHole,
  onHoleFilterChange,
  totalBlastHoles,
}) {
  const filterContainerRef = useRef(null);
  const hasHoles = totalBlastHoles > 0;
  const hasMatches = blastHoles.length > 0;
  const densityColor = densityPendingSync
    ? "var(--color-brand-amber)"
    : hasDensityData
      ? "var(--color-brand-cyan)"
      : "var(--color-text-muted)";
  const densityActionClass = densityPendingSync
    ? "border-(--color-brand-amber) bg-(--color-brand-amber-dim)"
    : hasDensityData
      ? "border-(--color-brand-cyan) bg-(--color-brand-cyan-dim)"
      : "border-(--color-border-default) bg-(--color-surface-base)";
  const densityBadgeClass = densityPendingSync
    ? "bg-(--color-brand-amber) text-white"
    : hasDensityData
      ? "bg-(--color-brand-cyan) text-white"
      : "bg-(--color-surface-1) text-(--color-text-faint)";
  const densityStatus = densityPendingSync
    ? "Pend."
    : hasDensityData
      ? "Sincronizado"
      : "Vacio";

  function handleFilterFocus() {
    filterContainerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  return (
    <section className="section-card w-full min-w-0">
      <div className="section-header">
        <div className="dot bg-(--color-brand-emerald)" />
        <span className="section-title">Datos de carga</span>
        <ActionIconButton
          title="Abrir control de densidad"
          onClick={onOpenDensityControl}
          color={densityColor}
          hoverColor={densityColor}
          className={`ml-auto rounded-[var(--radius-pill)] border px-3 py-2 transition-all enabled:hover:-translate-y-px enabled:hover:border-(--color-border-strong) ${densityActionClass}`}
        >
          <span className="rounded-full border border-(--color-border-subtle) bg-(--color-surface-1) px-3 py-1 font-(--font-mono) text-[0.625rem] uppercase tracking-[0.12em] text-(--color-text-faint)">
            C. Densidad
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em] ${densityBadgeClass}`}
          >
            {densityStatus}
          </span>
        </ActionIconButton>
      </div>
      <div
        ref={filterContainerRef}
        className="sticky bottom-0 border-b border-(--color-border-subtle) bg-(--color-surface-1)/95 p-2 backdrop-blur-md sm:p-3"
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <div className="col-span-full flex flex-col gap-2">
            <input
              type="number"
              value={holeFilter}
              onChange={(event) => {
                const val = event.target.value;
                if (val === "" || /^\d+$/.test(val)) {
                  onHoleFilterChange(val);
                }
              }}
              onFocus={handleFilterFocus}
              placeholder="00"
              autoComplete="off"
              inputMode="numeric"
              min="0"
              max="1000"
              className="field-input text-center font-(--font-mono)"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          className={`max-h-[60vh] overflow-y-auto px-4 pt-4 sm:px-5 sm:pt-5 ${cargaBodyHeightClass}`}
        >
          {hasMatches ? (
            <div className="grid grid-cols-2 gap-3 pb-4 md:grid-cols-3 xl:grid-cols-4">
              {blastHoles.map((hole) => {
                const draft =
                  holeDrafts[hole.id] ?? buildLoadingDraft(hole.loading);
                const hasData = hasDraftData(draft);

                return (
                  <CargaHoleCard
                    key={hole.id}
                    draft={draft}
                    hasData={hasData}
                    hole={hole}
                    onSelect={onSelectHole}
                  />
                );
              })}
            </div>
          ) : hasHoles ? (
            <div className="rounded-xl border border-dashed border-(--color-border-default) bg-(--color-surface-base) px-4 py-8 text-center font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
              Sin coincidencias para ese barreno
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-(--color-border-default) bg-(--color-surface-base) px-4 py-8 text-center font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
              Voladura sin barrenos cargados
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
