import ActionIconButton from "../../ui/ActionIconButton";
import AsyncIcon from "../../../assets/asyncIcon.svg";
import SyncIcon from "../../../assets/syncIcon.svg";

function getStatusMeta(status) {
  if (status === "syncing") {
    return {
      label: "Sincronizando",
      badgeTone:
        "border-(--color-brand-cyan)/30 bg-(--color-brand-cyan-dim) text-(--color-brand-cyan)",
      icon: <AsyncIcon />,
    };
  }

  if (status === "pending") {
    return {
      label: "Pendiente",
      badgeTone:
        "border-(--color-brand-amber)/30 bg-(--color-brand-amber)/10 text-(--color-brand-amber)",
      icon: <AsyncIcon />,
    };
  }

  return {
    label: "Sync ok",
    badgeTone:
      "border-(--color-brand-emerald)/30 bg-(--color-brand-emerald)/10 text-(--color-brand-emerald)",
    icon: <SyncIcon />,
  };
}

export default function CargaAccessoryUsageTrigger({
  disabled = false,
  onOpen,
  status = "synced",
}) {
  const meta = getStatusMeta(status);

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className="cursor-pointer inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-(--color-border-subtle) bg-(--color-surface-1) px-3 py-2 text-left transition-all enabled:hover:-translate-y-px enabled:hover:border-(--color-border-strong) disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="font-(--font-mono) text-[0.625rem] uppercase tracking-[0.12em] text-(--color-text-primary)">
        Accesorios
      </span>
      <span
        className={`rounded-full border px-2 py-0.5 font-(--font-mono) text-[0.5625rem] uppercase tracking-[0.12em] ${meta.badgeTone}`}
      >
        {meta.label}
      </span>
    </button>
  );
}
