import { useEffect, useState } from "react";

export default function LiveBadge() {
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-widest ${
        isOnline
          ? "border-(--color-brand-emerald) bg-(--color-brand-emerald-dim) text-(--color-brand-emerald)"
          : "border-(--color-brand-amber) bg-[color-mix(in_srgb,var(--color-brand-amber)_12%,transparent)] text-(--color-brand-amber)"
      }`}
    >
      <div
        className={`h-1.5 w-1.5 rounded-full ${
          isOnline
            ? "animate-pulse bg-(--color-brand-emerald)"
            : "bg-(--color-brand-amber)"
        }`}
      />
      {isOnline ? "En vivo" : "Desconectado"}
    </div>
  );
}
