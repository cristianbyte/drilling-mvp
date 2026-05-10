export default function SupervisorCargaSidebar({
  blasts,
  loading,
  onSelectBlast,
  selectedBlastId,
}) {
  return (
    <aside className="section-card w-full min-w-0 overflow-hidden lg:h-[calc(100vh-7rem)]">
      <div className="section-header">
        <div className="dot bg-(--color-brand-cyan)" />
        <span className="section-title">Voladuras</span>
      </div>

      <div className="max-h-[20rem] overflow-y-auto p-3 lg:max-h-[calc(100vh-10rem)]">
        {loading ? (
          <div className="rounded-[0.75rem] border border-dashed border-(--color-border-default) bg-(--color-surface-base) px-4 py-8 text-center font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
            Cargando voladuras
          </div>
        ) : blasts.length ? (
          <div className="space-y-2">
            {blasts.map((blast) => {
              const isActive = blast.id === selectedBlastId;

              return (
                <button
                  key={blast.id}
                  type="button"
                  onClick={() => onSelectBlast(blast.id)}
                  className={`w-full rounded-[0.75rem] border px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "border-(--color-brand-cyan) bg-(--color-brand-cyan-dim)"
                      : "border-(--color-border-subtle) bg-(--color-surface-1) hover:border-(--color-brand-cyan) hover:bg-(--color-brand-cyan-dim)"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-(--font-mono) text-[0.75rem] uppercase tracking-[0.14em] text-(--color-text-primary)">
                        {blast.blastCode}
                      </p>
                      <p className="mt-1 text-sm text-(--color-text-muted)">
                        {blast.location}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em] ${
                        blast.isComplete
                          ? "bg-(--color-surface-2) text-(--color-text-muted)"
                          : "bg-(--color-brand-amber-dim) text-(--color-brand-amber)"
                      }`}
                    >
                      {blast.isComplete ? "Completa" : "Activa"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[0.75rem] border border-dashed border-(--color-border-default) bg-(--color-surface-base) px-4 py-8 text-center font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
            Sin voladuras
          </div>
        )}
      </div>
    </aside>
  );
}
