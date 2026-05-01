import Tag from "./Tag";
import { formatTime } from "../lib/dateTime";

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

export default function SupervisorTable({
  tableRows = [],
  filtroTurno,
  setFiltroTurno,
  filtroOp,
  setFiltroOp,
  fmtDateTime,
}) {
  const headers = [
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
    "Actualizado",
    "Recencia",
    "Actualizado por",
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--color-text-muted)",
          }}
        >
          Ultimos 50 registros + tiempo real
        </span>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
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
              width: 160,
            }}
          />
        </div>
      </div>

      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border-default)" }}>
            {headers.map((header, index) => (
              <th
                key={`${header}-${index}`}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-text-muted)",
                  padding: "8px 12px",
                  textAlign: "left",
                  fontWeight: 400,
                  whiteSpace: "nowrap",
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {tableRows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "var(--color-text-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                }}
              >
                Sin registros para este filtro
              </td>
            </tr>
          ) : (
            tableRows.map((row, index) => (
              <tr
                key={row.drillingId || row.holeId || `row-${index}`}
                style={{
                  borderBottom: "1px solid var(--color-border-subtle)",
                  background:
                    index === 0
                      ? "var(--color-brand-amber-dim)"
                      : "transparent",
                }}
              >
                <td
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-brand-amber)",
                    fontSize: 13,
                    padding: "10px 12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {String(row.holeNumber || 0).padStart(2, "0")}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {row.operatorName || "-"}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                >
                  {row.equipment || "-"}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                >
                  <Tag turno={row.shift || "-"} />
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.pattern || "-"}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.plannedDepth === null || row.plannedDepth === undefined
                    ? "-"
                    : `${Number(row.plannedDepth).toFixed(1)} m`}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-brand-cyan)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.depth === null || row.depth === undefined
                    ? "-"
                    : `${Number(row.depth).toFixed(1)} m`}
                </td>
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                  <DepthDifferenceBadge
                    plannedDepth={row.plannedDepth}
                    depth={row.depth}
                  />
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.ceiling === null || row.ceiling === undefined
                    ? "-"
                    : `${Number(row.ceiling).toFixed(1)} m`}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.floor === null || row.floor === undefined
                    ? "-"
                    : `${Number(row.floor).toFixed(1)} m`}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatTime(row.createdAt)}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatTime(row.updatedAt)}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtDateTime(row.recency)}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.updatedBy || "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
