export default function CargaLeaderSection({
  blastId,
  blasts,
  isOnline,
  leaderId,
  leaders,
  loading,
  onBlastChange,
  onLeaderChange,
  onStart,
  pendingSyncCount,
  selectedBlast,
  startedContext,
  startingTurn,
  syncing,
}) {
  return (
    <section className="section-card w-full min-w-0">
      <div className="section-header">
        <div className="dot bg-(--color-brand-cyan)" />
        <span className="section-title">Datos lider</span>
        {startedContext && (
          <span
            className={`ml-auto font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em] ${syncing ? "text-(--color-brand-cyan)" : !isOnline ? "text-(--color-brand-amber)" : pendingSyncCount ? "text-(--color-brand-cyan)" : "border-(--color-brand-emerald)/30 bg-(--color-brand-emerald)/10 text-(--color-brand-emerald)"}`}
          >
            {syncing
              ? "Sincronizando"
              : !isOnline
                ? "Offline"
                : pendingSyncCount
                  ? "Pendiente"
                  : "Sync ok"}
          </span>
        )}
      </div>

      {!startedContext ? (
        <div className="space-y-5 p-4 sm:p-5">
          <button
            type="button"
            onClick={onStart}
            disabled={loading || startingTurn || !leaderId || !blastId}
            className="btn-primary"
          >
            {startingTurn ? "Cargando barrenos..." : "Iniciar turno"}
          </button>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="field-label">Nombre lider *</label>
              <select
                className="field-input"
                value={leaderId}
                onChange={(event) => onLeaderChange(event.target.value)}
                disabled={loading || startingTurn}
              >
                <option value="">
                  {loading ? "Cargando lideres..." : "Selecciona lider"}
                </option>
                {leaders.map((leader) => (
                  <option key={leader.id} value={leader.id}>
                    {leader.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Voladura *</label>
              <select
                className="field-input"
                value={blastId}
                onChange={(event) => onBlastChange(event.target.value)}
                disabled={loading || startingTurn}
              >
                <option value="">
                  {loading ? "Cargando voladuras..." : "Selecciona voladura"}
                </option>
                {blasts.map((blast) => (
                  <option key={blast.id} value={blast.id}>
                    {blast.blastCode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">Ubicacion</label>
            <div className="field-input flex items-center bg-(--color-surface-2) text-(--color-text-muted)">
              {selectedBlast?.location || "-"}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 p-2 sm:p-3 ">
          <div className="p-2 flex-1">
            <p className="font-(--font-mono) text-xs uppercase tracking-[0.14em] text-(--color-text-faint)">
              Nombre
            </p>
            <p className="mt-1 text-xs uppercase text-(--color-text-primary)">
              {startedContext.leaderName}
            </p>
          </div>

          <div className="p-2 flex-1">
            <p className="font-(--font-mono) text-xs uppercase tracking-[0.14em] text-(--color-text-faint)">
              Voladura
            </p>
            <p className="mt-1 text-xs text-(--color-text-primary)">
              {startedContext.blastCode}
            </p>
          </div>

          <div className="p-2 flex-1">
            <p className="font-(--font-mono) text-xs uppercase tracking-[0.14em] text-(--color-text-faint)">
              Ubicacion
            </p>
            <p className="mt-1 text-xs text-(--color-text-primary)">
              {startedContext.location}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
