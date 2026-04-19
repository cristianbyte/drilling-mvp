export default function Tag({ turno }) {
  const isDia = turno === 'DIA'
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10,
      padding: '3px 8px', borderRadius: 4,
      fontWeight: 500, textTransform: 'uppercase',
      background: isDia ? 'var(--color-brand-amber-dim)' : 'var(--color-brand-cyan-dim)',
      color: isDia ? 'var(--color-brand-amber)' : 'var(--color-brand-cyan)',
    }}>{turno}</span>
  )
}
