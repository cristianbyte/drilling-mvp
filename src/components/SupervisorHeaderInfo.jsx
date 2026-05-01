export default function SupervisorHeaderInfo({
  accentClassName,
  title,
  subtitle,
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <div
        className={`font-(--font-mono) text-[0.8125rem] uppercase tracking-[0.08em] ${accentClassName}`}
      >
        {title}
      </div>
      <div className="font-(--font-mono) text-[0.5rem] uppercase tracking-[0.08em] text-(--color-text-faint)">
        {subtitle}
      </div>
    </div>
  );
}
