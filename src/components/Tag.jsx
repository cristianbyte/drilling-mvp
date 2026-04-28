export default function Tag({ turno }) {
  const isDia = turno === "DIA";
  return (
    // <span style={{
    //   fontFamily: 'var(--font-mono)', fontSize: 10,
    //   padding: '3px 8px', borderRadius: 4,
    //   fontWeight: 500, textTransform: 'uppercase',
    //   background: isDia ? 'var(--color-brand-amber-dim)' : 'var(--color-brand-cyan-dim)',
    //   color: isDia ? 'var(--color-brand-amber)' : 'var(--color-brand-cyan)',
    // }}>{turno}</span>
    <span
      className={`text-xxs font-mono px-2 py-1 rounded-lg ${isDia ? "bg-(--color-brand-amber-dim) text-(--color-brand-amber)" : "bg-(--color-brand-cyan-dim) text-(--color-brand-cyan)"}`}
    >
      {turno}
    </span>
  );
}
