import {
  formatCompactDateTime,
  formatCompactDate,
} from "../../../../lib/datetime";

// import { densityControlFields } from "../lib/densityControl";

function countLoadedHoles(holes) {
  return holes.filter((hole) => {
    const loading = hole.loading;
    if (!loading) return false;

    return [
      loading.plannedDepth, // profundidad diseño
      loading.leveling, // nivelación
      loading.deck, // deck
      loading.emulsionTotal, // emulsion total
      loading.plannedEmulsion, // emulsion diseño
      loading.plannedStemmingInitial, // retacado inicial diseño
      loading.plannedStemmingFinal, // retacado final diseño
      loading.stemmingFinal, // retacado final real
    ].some((value) => value !== null);
  }).length;
}

function renderValue(value) {
  return value ?? "-";
}

function sortHolesByRecentLoading(holes) {
  return [...holes].sort((a, b) => {
    const aRecency = a.loading?.updatedAt || a.loading?.createdAt || "";
    const bRecency = b.loading?.updatedAt || b.loading?.createdAt || "";

    return new Date(bRecency || 0) - new Date(aRecency || 0);
  });
}

const loadingColumns = [
  { key: "plannedDepth", label: "Prof. D." },
  { key: "leveling", label: "Nivelacion" },
  { key: "deck", label: "Deck" },
  { key: "emulsionTotal", label: "Emul. F." },
  { key: "plannedEmulsion", label: "Emul. D." },
  { key: "plannedStemmingInitial", label: "Ret. Ini. D." },
  { key: "plannedStemmingFinal", label: "Ret. F. D." },
  { key: "stemmingFinal", label: "Ret. F. Real" },
];

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
  const sortedHoles = sortHolesByRecentLoading(blastFull.holes);

  return (
    <section className="section-card w-full min-w-0 overflow-hidden">
      <div className="section-header">
        <div className="dot bg-(--color-brand-emerald)" />
        <span className="section-title">Detalle de carga</span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[0.75rem] border border-(--color-border-subtle) bg-(--color-surface-base) px-4 py-3">
            <p className="font-(--font-mono) text-[0.6rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
              Voladura
            </p>
            <p className="mt-2 text-sm text-(--color-text-primary)">
              {blastFull.blastCode} - {blastFull.location}
            </p>
          </div>

          <div className="rounded-[0.75rem] border border-(--color-border-subtle) bg-(--color-surface-base) px-4 py-3">
            <p className="font-(--font-mono) text-[0.6rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
              Total Pozos Atc.
            </p>
            <p className="mt-2 text-sm text-(--color-text-primary)">
              {blastFull.holes.length}
            </p>
          </div>

          <div className="rounded-[0.75rem] border border-(--color-border-subtle) bg-(--color-surface-base) px-4 py-3">
            <p className="font-(--font-mono) text-[0.6rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
              Pozos con datos
            </p>
            <p className="mt-2 text-sm text-(--color-text-primary)">
              {loadedCount}
            </p>
          </div>

          <div className="rounded-[0.75rem] border border-(--color-border-subtle) bg-(--color-surface-base) px-4 py-3">
            <p className="font-(--font-mono) text-[0.6rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
              Emulsion T. Acu.
            </p>
            <p className="mt-2 text-sm text-(--color-text-primary)">
              {blastFull.holes
                .reduce((sum, hole) => {
                  const emulsion = hole.loading?.emulsionTotal;
                  return sum + (emulsion ? parseFloat(emulsion) : 0);
                }, 0)
                .toFixed(2)}
            </p>
          </div>
        </div>

        {/* <div className="rounded-[0.75rem] border border-(--color-border-subtle) bg-(--color-surface-base) p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-(--font-mono) text-[0.6rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
                Control de densidad
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {densityControlFields.map(({ key, label }) => (
              <div
                key={key}
                className="rounded-[0.75rem] border border-(--color-border-subtle) bg-(--color-surface-1) px-4 py-3"
              >
                <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em] text-(--color-text-muted)">
                  {label}
                </p>
                <p className="mt-2 text-sm text-(--color-text-primary)">
                  {renderValue(blastFull[key])}
                </p>
              </div>
            ))}
          </div>
        </div> */}

        <div className="space-y-3 lg:hidden">
          {sortedHoles.map((hole) => {
            const loadingRow = hole.loading;

            return (
              <article
                key={hole.id}
                className="rounded-[0.75rem] border border-(--color-border-subtle) bg-(--color-surface-base) p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.14em] text-(--color-text-primary)">
                      Barreno {String(hole.holeNumber).padStart(2, "0")}
                    </p>
                  </div>
                  <p className="shrink-0 font-(--font-mono) text-[0.625rem] uppercase tracking-[0.12em] text-(--color-text-faint)">
                    {formatCompactDateTime(loadingRow?.createdAt)}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-10 gap-y-2 text-[0.75rem] text-(--color-text-muted)">
                  {loadingColumns.map(({ key, label }) => (
                    <div key={key} className="min-w-0 flex">
                      <p className="font-(--font-mono) uppercase tracking-[0.12em] text-(--color-text-faint)">
                        {label}
                      </p>
                      <p className="ml-auto truncate text-(--color-text-primary)">
                        {renderValue(loadingRow?.[key])}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex w-full border-t border-(--color-border-subtle) pt-2">
                  <p className="font-(--font-mono) text-[0.625rem] uppercase tracking-[0.12em] text-(--color-text-faint)">
                    Registro
                  </p>
                  <p className="ml-auto text-[0.625rem] text-(--color-text-faint)">
                    {loadingRow?.leader?.name}
                    {loadingRow?.updatedBy &&
                      ` - Act: ${loadingRow?.updatedBy}`}
                  </p>
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
                  "Pozo",
                  "Lider",
                  "Prof. D.",
                  "Nivelacion",
                  "Deck",
                  "Emul. F.",
                  "Emul. D.",
                  "Ret. Ini. D.",
                  "Ret. F. D.",
                  "Ret. F. Real",
                  "Registro",
                ].map((label) => (
                  <th
                    key={label}
                    className="border-b border-(--color-border-subtle) px-2 py-3 text-left font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em] text-(--color-text-muted)"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-(--color-surface-1)">
              {sortedHoles.map((hole) => {
                const loadingRow = hole.loading;

                return (
                  <tr key={hole.id}>
                    <td className="border-b border-(--color-border-subtle) px-2 py-2 text-sm text-(--color-text-primary)">
                      {String(hole.holeNumber).padStart(2, "0")}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-2 py-2 text-sm text-(--color-text-primary)">
                      {loadingRow?.leader?.name || "-"}
                    </td>
                    {loadingColumns.map(({ key }) => (
                      <td
                        key={key}
                        className="border-b border-(--color-border-subtle) px-2 py-2 text-sm text-(--color-text-primary)"
                      >
                        {renderValue(loadingRow?.[key])}
                      </td>
                    ))}
                    <td className="border-b border-(--color-border-subtle) px-2 py-2 text-sm text-(--color-text-primary)">
                      {formatCompactDateTime(loadingRow?.createdAt)}
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
