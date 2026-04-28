export default function KpiCard({ label, value, sub, color }) {
  return (
    <div className="bg-(--color-surface-1) border border-(--color-border-default) rounded-(--radius-card) p-[16px_18px] relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-0.75"
        style={{ background: color }}
      />
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-(--color-text-muted) mb-2.5">
        {label}
      </div>
      <div
        className="font-mono text-[30px] font-medium leading-none"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-[8px] text-(--color-text-muted) mt-2 uppercase tracking-[0.04em]">
        {sub}
      </div>
    </div>
  );
}
