import LiveBadge from "./LiveBadge";
import { formatTime } from "../lib/datetime";

export default function SupervisorHeaderStatus({
  lastUpdate,
  badgeText,
  action,
}) {
  return (
    <div className="flex items-center gap-5">
      <div className="flex flex-col items-center gap-1 text-xs">
        <LiveBadge />
        <div className="text-[0.6rem] font-semibold text-(--color-text-faint)">
          {lastUpdate
            ? `Act. ${formatTime(lastUpdate, "America/Bogota", "es-CO", { second: "2-digit" })}`
            : "-"}
        </div>
      </div>

      {action}
    </div>
  );
}
