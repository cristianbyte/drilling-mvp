export default function Card({ title, children }) {
  return (
    <div className="bg-(--color-surface-1) border border-(--color-border-default) rounded-(--radius-card) p-4.5">
      {title && (
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mb-4">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
