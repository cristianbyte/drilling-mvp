export default function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--color-surface-1)',
      border: '1px solid var(--color-border-default)',
      borderRadius: 'var(--radius-card)',
      padding: '16px 18px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 'auto',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: color,
      }} />
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--color-text-muted)',
        marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 30,
        fontWeight: 500,
        color,
        lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 8,
        color: 'var(--color-text-muted)',
        marginTop: 8,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        {sub}
      </div>
    </div>
  )
}
