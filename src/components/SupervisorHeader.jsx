import LiveBadge from './LiveBadge'

export default function SupervisorHeader({ lastUpdate }) {
  return (
    <header style={{
      background: 'var(--color-surface-1)',
      borderBottom: '1px solid var(--color-border-default)',
      padding: '14px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 13,
        color: 'var(--color-brand-amber)',
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        Supervisor · Perforación
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <LiveBadge />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
          {lastUpdate
            ? `Actualizado ${new Date(lastUpdate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
            : '—'}
        </div>
      </div>
    </header>
  )
}
