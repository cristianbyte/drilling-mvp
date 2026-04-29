import Tag from "./Tag";

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

export default function SupervisorTable({
  tableRows = [],
  filtroTurno,
  setFiltroTurno,
  filtroOp,
  setFiltroOp,
  setDeleteTarget,
  fmtTime,
}) {
  const headers = [
    "Barreno",
    "Ubicacion",
    "Operador",
    "Equipo",
    "Voladura",
    "Prof.",
    "Turno",
    "Hora",
    "",
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
          Ultimos registros (max 50)
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
                key={row.holeId || `row-${index}`}
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
                  B-{String(row.holeNumber || 0).padStart(2, "0")}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.location || "-"}
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
                  {row.blastCode || row.blastId || "-"}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-brand-cyan)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {Number(row.depth || 0).toFixed(1)} m
                </td>
                <td style={{ padding: "10px 12px" }}>
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
                  {fmtTime(row.createdAt)}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget({
                        holeId: row.holeId,
                        holeNumber: row.holeNumber,
                        operatorName: row.operatorName,
                      });
                    }}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--color-danger)",
                      borderRadius: "var(--radius-btn)",
                      color: "var(--color-danger)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      padding: "4px 10px",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
