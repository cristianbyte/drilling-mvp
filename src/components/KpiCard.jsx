export default function KpiCard({ label, value, sub, color }) {
  return (
    <div className="flex justify-between bg-(--color-surface-1) border border-(--color-border-default) rounded-(--radius-card) p-[16px_18px] relative overflow-hidden">
      <div className="flex flex-col font-mono text-xs uppercase tracking-[0.12em] text-(--color-text-muted)">
        <span>{label}</span>
        <span className="text-[10px]">{sub}</span>
      </div>
      <div
        className="font-mono text-[30px] font-medium leading-none"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}
