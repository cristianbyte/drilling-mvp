import SupervisorHeaderInfo from "./SupervisorHeaderInfo";
import SupervisorHeaderStatus from "./SupervisorHeaderStatus";

export default function SupervisorHeader({
  accentClassName = "text-(--color-brand-amber)",
  title = "Supervisor / Perforacion",
  subtitle = "Dashboard: ultimos 50 registros",
  lastUpdate,
  badgeText = null,
  action = null,
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-(--color-border-default) bg-(--color-surface-1)/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <SupervisorHeaderInfo
          accentClassName={accentClassName}
          title={title}
          subtitle={subtitle}
        />
        <SupervisorHeaderStatus
          lastUpdate={lastUpdate}
          badgeText={badgeText}
          action={action}
        />
      </div>
    </header>
  );
}
