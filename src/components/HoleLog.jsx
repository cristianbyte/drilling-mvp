import { useState } from "react";
import ActionIconButton from "./ActionIconButton";
import ConfirmModal from "./ConfirmModal";
import EditHoleModal from "./EditHoleModal";
import { showToast } from "./Toast";
import TrashIcon from "../assets/trashIcon.svg";
import SyncIcon from "../assets/syncIcon.svg";
import AsyncIcon from "../assets/asyncIcon.svg";
import EditIcon from "../assets/editIcon.svg";

function SyncStatusIcon({ synced }) {
  return <>{synced ? <SyncIcon /> : <AsyncIcon />}</>;
}

function formatMeters(value) {
  if (value === null || value === undefined || value === "") return "";
  return `${Number(value).toFixed(1)} m`;
}

function formatTPInline(label, value) {
  if (value === null || value === undefined || value === "") return null;
  return `${label}:${Number(value).toFixed(1)}m`;
}

export default function HoleLog({
  holes,
  totalMeters,
  onDelete,
  onEdit,
  operatorName,
  onForceSync,
  syncDisabled = false,
  syncing = false,
}) {
  const [pendingDelete, setPendingDelete] = useState(null);
  const [editingHoleId, setEditingHoleId] = useState(null);

  const targetHole = holes.find((h) => h.holeId === pendingDelete);
  const editingHole = holes.find((h) => h.holeId === editingHoleId);

  function handleDeleteConfirm() {
    onDelete(pendingDelete);
    showToast(
      `Barreno B-${String(targetHole.holeNumber).padStart(2, "0")} eliminado`,
    );
    setPendingDelete(null);
  }

  async function handleEditSave(patch) {
    if (!editingHole) return;

    await onEdit(editingHole.holeId, patch);
    showToast(
      `Barreno B-${String(editingHole.holeNumber).padStart(2, "0")} editado por ${operatorName || "operador"}`,
    );
    setEditingHoleId(null);
  }

  const deleteRows = targetHole
    ? [
        {
          key: "# Barreno",
          val: `B-${String(targetHole.holeNumber).padStart(2, "0")}`,
          accent: true,
        },
        {
          key: "Profundidad",
          val: `${targetHole.depth.toFixed(1)} m`,
          accent: true,
        },
        { key: "Techo", val: formatMeters(targetHole.ceiling) || "-" },
        { key: "Piso", val: formatMeters(targetHole.floor) || "-" },
      ]
    : [];

  return (
    <>
      <div className="section-card w-full min-w-0 max-w-full">
        <div className="section-header">
          <div
            className="dot"
            style={{ background: "var(--color-border-strong)" }}
          />
          <span className="section-title">Registros del turno</span>
          <ActionIconButton
            title={
              syncDisabled
                ? "No hay registros pendientes por sincronizar"
                : syncing
                  ? "Sincronizando..."
                  : "Sincronizar pendientes"
            }
            onClick={onForceSync}
            disabled={syncDisabled || syncing}
            color={
              syncDisabled
                ? "var(--color-text-faint)"
                : "var(--color-brand-cyan)"
            }
            hoverColor="var(--color-brand-emerald)"
          >
            <AsyncIcon />
          </ActionIconButton>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--color-brand-amber)",
              }}
            >
              {totalMeters.toFixed(1)} m
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.5625rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--color-text-muted)",
              }}
            >
              Total perforado
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          {holes.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-text-faint)",
                padding: "2rem 0",
              }}
            >
              Aun no hay registros
            </p>
          ) : (
            [...holes].reverse().map((hole, index) => {
              const isSynced = Boolean(hole.synced);
              const ceilingText = formatTPInline("T", hole.ceiling);
              const floorText = formatTPInline("P", hole.floor);
              const detailText =
                [ceilingText, floorText].filter(Boolean).join(" · ") ||
                "Sin T/P";

              return (
                <div
                  key={hole.holeId}
                  className={`${index === 0 ? "slide-down" : ""} min-w-0`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    gap: "0.75rem",
                    borderBottom: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      minWidth: 0,
                      flex: "1 1 16rem",
                      gap: "0.75rem",
                    }}
                  >
                    <ActionIconButton
                      title={
                        isSynced
                          ? "Sincronizado"
                          : "Pendiente de sincronizacion"
                      }
                      disabled
                      color={
                        isSynced
                          ? "var(--color-brand-emerald)"
                          : "var(--color-text-muted)"
                      }
                    >
                      <SyncStatusIcon synced={isSynced} />
                    </ActionIconButton>

                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--color-brand-cyan)",
                        background: "var(--color-brand-cyan-dim)",
                        border:
                          "1px solid color-mix(in srgb, var(--color-brand-cyan) 25%, transparent)",
                        borderRadius: "0.25rem",
                        padding: "0.25rem 0.5rem",
                      }}
                    >
                      B-{String(hole.holeNumber).padStart(2, "0")}
                    </span>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                        gap: "0.125rem",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.625rem",
                          color: "var(--color-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {detailText}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flex: "0 1 auto",
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                      gap: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "1rem",
                        fontWeight: 600,
                        color: "var(--color-brand-amber)",
                      }}
                    >
                      {Number(hole.depth || 0).toFixed(1)} m
                    </span>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.125rem",
                      }}
                    >
                      <ActionIconButton
                        title="Editar barreno"
                        onClick={() => setEditingHoleId(hole.holeId)}
                        color="var(--color-text-faint)"
                        hoverColor="var(--color-brand-amber)"
                      >
                        <EditIcon />
                      </ActionIconButton>

                      <ActionIconButton
                        title="Eliminar barreno"
                        onClick={() => setPendingDelete(hole.holeId)}
                        color="var(--color-text-faint)"
                        hoverColor="var(--color-danger)"
                      >
                        <TrashIcon />
                      </ActionIconButton>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {pendingDelete && targetHole && (
        <ConfirmModal
          title="Eliminar barreno"
          rows={deleteRows}
          onConfirm={handleDeleteConfirm}
          onCorrect={() => setPendingDelete(null)}
          danger
          confirmLabel="Eliminar"
          correctLabel="Cancelar"
        />
      )}

      {editingHole && (
        <EditHoleModal
          hole={editingHole}
          onClose={() => setEditingHoleId(null)}
          onSave={handleEditSave}
        />
      )}
    </>
  );
}
