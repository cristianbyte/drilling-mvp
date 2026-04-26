export default function ActionIconButton({
  title,
  onClick,
  children,
  color = "var(--color-text-faint)",
  hoverColor = color,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={title}
      disabled={disabled}
      style={{
        background: "none",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        color,
        opacity: disabled ? 0.7 : 1,
        padding: "0.25rem",
        borderRadius: "0.25rem",
        transition: "color 0.15s",
        display: "flex",
        alignItems: "center",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.color = hoverColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = color;
      }}
    >
      {children}
    </button>
  );
}
