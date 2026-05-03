import CargaHoleCard from "./CargaHoleCard";

export default function CargaHolesSection({
  blastHoles,
  buildLoadingDraft,
  cargaBodyHeightClass,
  hasDraftData,
  holeDrafts,
  onSelectHole,
}) {
  return (
    <section className="section-card w-full min-w-0">
      <div className="section-header">
        <div className="dot bg-(--color-brand-emerald)" />
        <span className="section-title">Datos de carga</span>
      </div>

      <div
        className={`max-h-[60vh] overflow-y-auto p-4 sm:p-5 ${cargaBodyHeightClass}`}
      >
        {blastHoles.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
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
        ) : (
          <div className="rounded-[0.75rem] border border-dashed border-(--color-border-default) bg-(--color-surface-base) px-4 py-8 text-center font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
            Voladura sin barrenos cargados
          </div>
        )}
      </div>
    </section>
  );
}
