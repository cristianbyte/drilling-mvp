import LiveBadge from './LiveBadge'

function ExportExcelIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M11.5 21h-4.5a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v5m-5 6h7m-3 -3l3 3l-3 3" />
    </svg>
  )
}

export default function SupervisorHeader({
  lastUpdate,
  selectedDate,
  onOpenExport,
  exportDisabled = false,
}) {
  return (
    <header style={{
      background: 'var(--color-surface-1)',
      borderBottom: '1px solid var(--color-border-default)',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', color: 'var(--color-text-faint)', gap: 0 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--color-brand-amber)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Supervisor · Perforacion
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          color: 'var(--color-text-faint)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Dashboard: ultimos 50 registros
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          color: 'var(--color-text-faint)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Exportacion: fecha {selectedDate}
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1 flex-col text-xs">
          <LiveBadge />
          <div className="font-font-mono text-[0.6rem] text-text-faint font-semibold">
            {lastUpdate
              ? `Act. ${new Date(lastUpdate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : '-'}
          </div>
        </div>

        <div className="exportExcel">
          <button
            type="button"
            onClick={onOpenExport}
            disabled={exportDisabled}
            title={exportDisabled ? 'No hay fechas disponibles' : 'Exportar a Excel'}
            style={{
              background: 'transparent',
              border: `2px solid ${exportDisabled ? 'var(--color-border-default)' : 'var(--color-brand-emerald)'}`,
              color: exportDisabled ? 'var(--color-text-faint)' : 'var(--color-brand-emerald)',
              borderRadius: 'var(--radius-btn)',
              padding: '0.35rem',
              cursor: exportDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ExportExcelIcon />
          </button>
        </div>
      </div>
    </header>
  )
}
