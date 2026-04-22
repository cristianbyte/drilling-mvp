import { useEffect, useRef } from "react";

export default function LiveBadge() {
  const dotRef = useRef(null);

  useEffect(() => {
    const el = dotRef.current;
    if (!el) return;
    const id = setInterval(() => {
      el.style.opacity = el.style.opacity === "0.2" ? "1" : "0.2";
    }, 750);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background:
          "color-mix(in srgb, var(--color-brand-emerald) 12%, transparent)",
        border:
          "1px solid color-mix(in srgb, var(--color-brand-emerald) 35%, transparent)",
        borderRadius: "var(--radius-pill)",
        padding: "4px 12px",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--color-brand-emerald)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}
    >
      <div
        ref={dotRef}
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--color-brand-emerald)",
          transition: "opacity 0.3s",
        }}
      />
      En vivo
    </div>
  );
}
