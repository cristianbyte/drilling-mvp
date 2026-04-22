export default function Card({ title, children }) {
  return (
    <div
      style={{
        background: "var(--color-surface-1)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-card)",
        padding: 18,
      }}
    >
      {title && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--color-text-muted)",
            marginBottom: 16,
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
