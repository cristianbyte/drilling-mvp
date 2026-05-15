import ActionIconButton from "../../ui/ActionIconButton";
import AsyncIcon from "../../../assets/asyncIcon.svg";
import EditIcon from "../../../assets/editIcon.svg";
import SyncIcon from "../../../assets/syncIcon.svg";
import { formatCompactDateTime } from "../../../lib/datetime";

function formatQty(value) {
  return Number(value || 0).toLocaleString("es-DO", {
    maximumFractionDigits: 0,
  });
}

function SyncStatusIcon({ synced }) {
  return synced ? <SyncIcon /> : <AsyncIcon />;
}

export default function CargaAccessoryUsageModal({
  blast,
  form,
  isEditing = false,
  onClose,
  onDelete,
  onEdit,
  onFieldChange,
  onResetForm,
  onSave,
  records = [],
}) {
  const totalIkon = records.reduce(
    (sum, record) => sum + Number(record.ikon15m || 0),
    0,
  );
  const totalP337 = records.reduce(
    (sum, record) => sum + Number(record.p337 || 0),
    0,
  );
  const isSaveDisabled =
    !String(form.ikon15m || "").trim() || !String(form.p337 || "").trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-card)] border border-(--color-border-subtle) bg-(--color-surface-1) shadow-2xl"
        style={{ maxHeight: "92dvh" }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-(--color-border-subtle) px-5 py-4">
          <div className="min-w-0">
            <p className="font-(--font-mono) text-[0.6rem] uppercase tracking-[0.18em] text-(--color-text-muted)">
              Consumo accesorios
            </p>
            <h2 className="mt-0.5 truncate text-base font-semibold text-(--color-text-primary)">
              {blast?.blastCode || "Voladura"}
            </h2>
            <p className="truncate text-sm text-(--color-text-muted)">
              {blast?.location || "Ubicación no disponible"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-[var(--radius-btn)] border border-(--color-border-default) px-3 py-1.5 font-(--font-mono) text-[0.625rem] uppercase tracking-[0.12em] text-(--color-text-muted) transition-colors hover:border-(--color-border-strong) hover:text-(--color-text-primary)"
          >
            Cerrar
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="shrink-0 space-y-3 border-b border-(--color-border-subtle) bg-(--color-surface-base) px-5 py-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2">
                <label className="field-label">Fecha de uso</label>
                <input
                  type="date"
                  value={form.usageDate}
                  onChange={(event) =>
                    onFieldChange("usageDate", event.target.value)
                  }
                  className="field-input w-full"
                />
              </div>
              <div>
                <label className="field-label">Ikon 15m</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="99"
                  step="1"
                  value={form.ikon15m}
                  onChange={(event) =>
                    onFieldChange("ikon15m", event.target.value)
                  }
                  className="field-input w-full"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="field-label">Poison</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="99"
                  step="1"
                  value={form.p337}
                  onChange={(event) =>
                    onFieldChange("p337", event.target.value)
                  }
                  className="field-input w-full"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="field-label">Notas</label>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(event) => onFieldChange("notes", event.target.value)}
                className="field-input w-full resize-none"
                placeholder="Observaciones"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaveDisabled}
                  className="btn-primary w-full sm:w-auto sm:px-6"
                >
                  {isEditing ? "Guardar cambios" : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={isEditing ? onResetForm : onClose}
                  className="btn-secondary w-full sm:w-auto sm:px-6"
                >
                  {isEditing ? "Cancelar edicion" : "Cancelar"}
                </button>
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="self-start rounded-[var(--radius-btn)] border border-transparent px-1 py-1 text-left font-(--font-mono) text-[0.625rem] uppercase tracking-[0.12em] text-(--color-danger) underline decoration-from-font underline-offset-2 transition-colors hover:bg-(--color-danger)/8 sm:self-auto"
                >
                  Eliminar registro
                </button>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-(--color-border-subtle) px-5 py-3">
              <div className="flex items-center gap-2">
                <p className="font-(--font-mono) text-[0.6rem] uppercase tracking-[0.16em] text-(--color-text-muted)">
                  Historial
                </p>
                <span className="rounded-[var(--radius-pill)] bg-(--color-surface-2) px-1.5 py-0.5 font-(--font-mono) text-[0.55rem] text-(--color-text-faint)">
                  {records.length}
                </span>
              </div>
              {records.length > 0 && (
                <div className="flex items-center gap-3 font-(--font-mono) text-[0.6rem] uppercase tracking-[0.12em]">
                  <span className="text-(--color-brand-cyan)">
                    T. Ikon {formatQty(totalIkon)}
                  </span>
                  <span className="text-(--color-text-faint)">·</span>
                  <span className="text-(--color-brand-amber)">
                    T. Poison {formatQty(totalP337)}
                  </span>
                </div>
              )}
            </div>

            {records.length ? (
              <ul className="divide-y divide-(--color-border-subtle)">
                {records.map((record) => (
                  <li
                    key={record.id}
                    className={`flex items-start justify-between gap-3 px-5 py-3 transition-colors hover:bg-(--color-surface-base) ${isEditing && form.id === record.id ? "bg-(--color-surface-base) ring-1 ring-inset ring-(--color-brand-cyan)/25" : ""}`}
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-(--font-mono) text-[0.6875rem] font-medium text-(--color-text-faint)">
                          {record.usageDate}
                        </span>
                        <div className="font-(--font-mono) text-[0.6875rem] text-(--color-text-faint)">
                          <span>IKON:</span>
                          <span className="text-(--color-brand-cyan)">
                            {` ` + formatQty(record.ikon15m)}
                          </span>
                          <span className="mx-1 text-(--color-text-faint)">
                            ·
                          </span>
                          <span>POISON:</span>
                          <span className="text-(--color-brand-amber)">
                            {` ` + formatQty(record.p337)}
                          </span>
                        </div>
                      </div>

                      {record.notes && (
                        <p className="text-xs leading-5 text-(--color-text-muted)">
                          {record.notes}
                        </p>
                      )}

                      <div className="space-y-0.5 font-(--font-mono) text-[0.6rem] text-(--color-text-faint)">
                        <p className="truncate">
                          Creado: {record.createdBy} ·{" "}
                          {formatCompactDateTime(record.createdAt)}
                        </p>
                        {record.updatedBy && record.updatedAt && (
                          <p className="truncate">
                            Actualizado: {record.updatedBy} ·{" "}
                            {formatCompactDateTime(record.updatedAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5 pt-0.5 text-(--color-text-faint)">
                      <ActionIconButton
                        title="Editar registro"
                        onClick={() => onEdit(record)}
                        color="var(--color-text-faint)"
                        hoverColor="var(--color-brand-cyan)"
                      >
                        <EditIcon />
                      </ActionIconButton>
                      <ActionIconButton
                        title={
                          record.synced
                            ? "Sincronizado"
                            : "Pendiente de sincronización"
                        }
                        disabled
                        color={
                          record.synced
                            ? "var(--color-brand-emerald)"
                            : "var(--color-brand-amber)"
                        }
                      >
                        <SyncStatusIcon synced={record.synced} />
                      </ActionIconButton>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-1 items-center justify-center px-4 py-12 font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.14em] text-(--color-text-faint)">
                Sin registros de accesorios
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
