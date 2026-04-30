function countLoadedHoles(holes) {
  return holes.filter((hole) => {
    const loading = hole.loading;
    if (!loading) return false;

    return [
      loading.leveling,
      loading.deck,
      loading.emulsionTotal,
      loading.stemmingFinal,
    ].some((value) => value !== null);
  }).length;
}

function renderValue(value) {
  return value ?? "-";
}

export default function SupervisorCargaDetail({ blastFull, loading }) {
  if (loading) {
    return (
      <section className="section-card w-full min-w-0 overflow-hidden">
        <div className="section-header">
          <div className="dot bg-(--color-brand-emerald)" />
          <span className="section-title">Detalle de carga</span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="rounded-[0.75rem] border border-dashed border-(--color-border-default) bg-(--color-surface-base) px-4 py-12 text-center font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
            Cargando detalle
          </div>
        </div>
      </section>
    );
  }

  if (!blastFull) {
    return (
      <section className="section-card w-full min-w-0 overflow-hidden">
        <div className="section-header">
          <div className="dot bg-(--color-brand-emerald)" />
          <span className="section-title">Detalle de carga</span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="rounded-[0.75rem] border border-dashed border-(--color-border-default) bg-(--color-surface-base) px-4 py-12 text-center font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
            Selecciona voladura
          </div>
        </div>
      </section>
    );
  }

  const loadedCount = countLoadedHoles(blastFull.holes);

  return (
    <section className="section-card w-full min-w-0 overflow-hidden">
      <div className="section-header">
        <div className="dot bg-(--color-brand-emerald)" />
        <span className="section-title">Detalle de carga</span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[0.75rem] border border-(--color-border-subtle) bg-(--color-surface-base) px-4 py-3">
            <p className="font-(--font-mono) text-[0.6rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
              Voladura
            </p>
            <p className="mt-2 text-sm text-(--color-text-primary)">
              {blastFull.blastCode}
            </p>
          </div>

          <div className="rounded-[0.75rem] border border-(--color-border-subtle) bg-(--color-surface-base) px-4 py-3">
            <p className="font-(--font-mono) text-[0.6rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
              Ubicacion
            </p>
            <p className="mt-2 text-sm text-(--color-text-primary)">
              {blastFull.location}
            </p>
          </div>

          <div className="rounded-[0.75rem] border border-(--color-border-subtle) bg-(--color-surface-base) px-4 py-3">
            <p className="font-(--font-mono) text-[0.6rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
              Barrenos
            </p>
            <p className="mt-2 text-sm text-(--color-text-primary)">
              {blastFull.holes.length}
            </p>
          </div>

          <div className="rounded-[0.75rem] border border-(--color-border-subtle) bg-(--color-surface-base) px-4 py-3">
            <p className="font-(--font-mono) text-[0.6rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
              Cargados
            </p>
            <p className="mt-2 text-sm text-(--color-text-primary)">
              {loadedCount}
            </p>
          </div>
        </div>

        <div className="space-y-3 lg:hidden">
          {blastFull.holes.map((hole) => {
            const loadingRow = hole.loading;

            return (
              <article
                key={hole.id}
                className="rounded-[0.75rem] border border-(--color-border-subtle) bg-(--color-surface-base) p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-(--font-mono) text-[0.75rem] uppercase tracking-[0.14em] text-(--color-text-primary)">
                    Barreno {String(hole.holeNumber).padStart(2, "0")}
                  </p>
                  <p className="text-xs text-(--color-text-muted)">
                    {loadingRow?.leader?.name || "-"}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-(--color-text-muted)">
                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Planned depth
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {renderValue(loadingRow?.plannedDepth)}
                    </p>
                  </div>

                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Planned emulsion
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {renderValue(loadingRow?.plannedEmulsion)}
                    </p>
                  </div>

                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Leveling
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {renderValue(loadingRow?.leveling)}
                    </p>
                  </div>

                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Deck
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {renderValue(loadingRow?.deck)}
                    </p>
                  </div>

                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Emulsion total
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {renderValue(loadingRow?.emulsionTotal)}
                    </p>
                  </div>

                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Stemming final
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {renderValue(loadingRow?.stemmingFinal)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-[0.75rem] border border-(--color-border-subtle)">
            <thead className="bg-(--color-surface-base)">
              <tr>
                {[
                  "Barreno",
                  "Lider",
                  "Planned depth",
                  "Planned emulsion",
                  "Leveling",
                  "Deck",
                  "Emulsion total",
                  "Stemming final",
                ].map((label) => (
                  <th
                    key={label}
                    className="border-b border-(--color-border-subtle) px-4 py-3 text-left font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em] text-(--color-text-muted)"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-(--color-surface-1)">
              {blastFull.holes.map((hole) => {
                const loadingRow = hole.loading;

                return (
                  <tr key={hole.id}>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {String(hole.holeNumber).padStart(2, "0")}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {loadingRow?.leader?.name || "-"}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {renderValue(loadingRow?.plannedDepth)}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {renderValue(loadingRow?.plannedEmulsion)}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {renderValue(loadingRow?.leveling)}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {renderValue(loadingRow?.deck)}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {renderValue(loadingRow?.emulsionTotal)}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {renderValue(loadingRow?.stemmingFinal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
