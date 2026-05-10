import { useMemo, useState } from "react";
import Tag from "../../../ui/Tag";
import { formatTime } from "../../../../lib/datetime";

function FilterBtn({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "var(--color-brand-amber-dim)" : "transparent",
        border: `1px solid ${active ? "var(--color-brand-amber)" : "var(--color-border-default)"}`,
        borderRadius: "var(--radius-input)",
        color: active ? "var(--color-brand-amber)" : "var(--color-text-muted)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        padding: "7px 14px",
        cursor: "pointer",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </button>
  );
}

function DepthDifferenceBadge({ plannedDepth, depth }) {
  if (
    plannedDepth === null ||
    plannedDepth === undefined ||
    depth === null ||
    depth === undefined
  ) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 88,
          padding: "6px 8px",
          borderRadius: 8,
          border: "1px solid var(--color-border-default)",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
        }}
      >
        -
      </span>
    );
  }

  const planned = Number(plannedDepth);
  const actual = Number(depth);

  if (Number.isNaN(planned) || Number.isNaN(actual)) {
    return null;
  }

  const delta = actual - planned;
  const percent = planned === 0 ? 0 : (delta / planned) * 100;
  const isEqual = delta === 0;
  const isShort = delta < 0;

  let background = "var(--color-brand-emerald-dim)";
  let border = "var(--color-brand-emerald)";
  let color = "var(--color-brand-emerald)";

  if (isShort) {
    background = "color-mix(in srgb, var(--color-danger) 18%, transparent)";
    border = "var(--color-danger)";
    color = "var(--color-danger)";
  } else if (!isEqual) {
    background = "var(--color-brand-amber-dim)";
    border = "var(--color-brand-amber)";
    color = "var(--color-brand-amber)";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 88,
        padding: "6px 8px",
        borderRadius: 8,
        border: `1px solid ${border}`,
        background,
        color,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        whiteSpace: "nowrap",
      }}
    >
      {`${percent >= 0 ? "+" : ""}${percent.toFixed(1)}% / ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`}
    </span>
  );
}

function formatMeters(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${Number(value).toFixed(1)} m`;
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-(--color-border-subtle) bg-(--color-surface-base) px-3 py-3">
      <p className="font-(--font-mono) text-[0.6rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
        {label}
      </p>
      <p className="mt-0 text-sm text-(--color-text-primary) ">{value}</p>
    </div>
  );
}

export default function SupervisorPerforacionDetail({
  blast,
  rows = [],
  loading,
  fmtDateTime,
}) {
  const [filtroTurno, setFiltroTurno] = useState("TODOS");
  const [filtroOp, setFiltroOp] = useState("");

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const turnoOk = filtroTurno === "TODOS" || row.shift === filtroTurno;
        const opOk =
          !filtroOp ||
          (row.operatorName || "")
            .toLowerCase()
            .includes(filtroOp.toLowerCase());

        return turnoOk && opOk;
      }),
    [filtroOp, filtroTurno, rows],
  );

  const totalMetros = useMemo(
    () => filteredRows.reduce((sum, row) => sum + Number(row.depth || 0), 0),
    [filteredRows],
  );
  const promMetros = filteredRows.length
    ? totalMetros / filteredRows.length
    : 0;
  const totalOps = new Set(
    filteredRows
      .map((row) => row.operatorName)
      .filter(Boolean)
      .filter((name) => name !== "-"),
  ).size;

  if (loading) {
    return (
      <section className="section-card w-full min-w-0 overflow-hidden">
        <div className="section-header">
          <div className="dot bg-(--color-brand-emerald)" />
          <span className="section-title">Detalle de perforacion</span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="rounded-[0.75rem] border border-dashed border-(--color-border-default) bg-(--color-surface-base) px-4 py-12 text-center font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
            Cargando detalle
          </div>
        </div>
      </section>
    );
  }

  if (!blast) {
    return (
      <section className="section-card w-full min-w-0 overflow-hidden">
        <div className="section-header">
          <div className="dot bg-(--color-brand-emerald)" />
          <span className="section-title">Detalle de perforacion</span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="rounded-[0.75rem] border border-dashed border-(--color-border-default) bg-(--color-surface-base) px-4 py-12 text-center font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
            Selecciona voladura
          </div>
        </div>
      </section>
    );
  }

  let progress = filteredRows.filter(
    (row) => Number(row.depth || 0) > 0,
  ).length;

  return (
    <section className="section-card w-full min-w-0 overflow-hidden">
      <div className="section-header">
        <div className="dot bg-(--color-brand-emerald)" />
        <span className="section-title">Detalle de perforacion</span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Voladura"
            value={`${blast.blastCode} - ${blast.location}`}
          />
          <MetricCard
            label="Barrenos perforados"
            value={`${progress} / ${filteredRows.length}`}
          />
          <MetricCard label="Metros totales" value={totalMetros.toFixed(1)} />
          <MetricCard
            label="Avance"
            value={`${((progress / filteredRows.length) * 100).toFixed(1)}%`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { key: "TODOS", label: "Todos" },
              { key: "DIA", label: "Dia" },
              { key: "NOCHE", label: "Noche" },
            ].map(({ key, label }) => (
              <FilterBtn
                key={key}
                label={label}
                active={filtroTurno === key}
                onClick={() => setFiltroTurno(key)}
              />
            ))}

            <input
              value={filtroOp}
              onChange={(e) => setFiltroOp(e.target.value)}
              placeholder="Buscar operador..."
              style={{
                background: "var(--color-surface-base)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-input)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                padding: "7px 12px",
                outline: "none",
                width: "auto",
              }}
            />
          </div>

          <p className="font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
            Operadores: {totalOps}
          </p>
        </div>

        <div className="space-y-3 lg:hidden">
          {filteredRows.length ? (
            filteredRows.map((row, index) => (
              <article
                key={row.drillingId || row.holeId || `row-${index}`}
                className="rounded-[0.75rem] border border-(--color-border-subtle) bg-(--color-surface-base) p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-(--font-mono) text-[0.75rem] uppercase tracking-[0.14em] text-(--color-text-primary)">
                    Barreno {String(row.holeNumber || 0).padStart(2, "0")}
                  </p>
                  <Tag turno={row.shift || "-"} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-(--color-text-muted)">
                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Operador
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {row.operatorName || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Equipo
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {row.equipment || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Patron
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {row.pattern || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Prof. planificada
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {formatMeters(row.plannedDepth)}
                    </p>
                  </div>
                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Prof. real
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {formatMeters(row.depth)}
                    </p>
                  </div>
                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Diferencia
                    </p>
                    <div className="mt-1">
                      <DepthDifferenceBadge
                        plannedDepth={row.plannedDepth}
                        depth={row.depth}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Techo
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {formatMeters(row.ceiling)}
                    </p>
                  </div>
                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Piso
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {formatMeters(row.floor)}
                    </p>
                  </div>
                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Creado
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {formatTime(row.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em]">
                      Recencia
                    </p>
                    <p className="mt-1 text-(--color-text-primary)">
                      {fmtDateTime(row.recency)}
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[0.75rem] border border-dashed border-(--color-border-default) bg-(--color-surface-base) px-4 py-12 text-center font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.14em] text-(--color-text-muted)">
              Sin registros para este filtro
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-[0.75rem] border border-(--color-border-subtle)">
            <thead className="bg-(--color-surface-base)">
              <tr>
                {[
                  "Barreno",
                  "Operador",
                  "Equipo",
                  "Turno",
                  "Patron",
                  "Prof. D.",
                  "Prof.",
                  "Diferencia",
                  "Techo",
                  "Piso",
                  "Creado",
                  "Recencia",
                  "Actualizado por",
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
              {filteredRows.length ? (
                filteredRows.map((row, index) => (
                  <tr key={row.drillingId || row.holeId || `row-${index}`}>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-brand-amber)">
                      {String(row.holeNumber || 0).padStart(2, "0")}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {row.operatorName || "-"}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {row.equipment || "-"}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      <Tag turno={row.shift || "-"} />
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {row.pattern || "-"}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {formatMeters(row.plannedDepth)}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {formatMeters(row.depth)}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      <DepthDifferenceBadge
                        plannedDepth={row.plannedDepth}
                        depth={row.depth}
                      />
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {formatMeters(row.ceiling)}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {formatMeters(row.floor)}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {formatTime(row.createdAt)}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {fmtDateTime(row.recency)}
                    </td>
                    <td className="border-b border-(--color-border-subtle) px-4 py-3 text-sm text-(--color-text-primary)">
                      {row.updatedBy || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={13}
                    className="px-4 py-12 text-center font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.14em] text-(--color-text-muted)"
                  >
                    Sin registros para este filtro
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
