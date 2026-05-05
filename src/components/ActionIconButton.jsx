export default function ActionIconButton({
  title,
  onClick,
  children,
  color = "var(--color-brand-cyan)",
  hoverColor = color,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={title}
      style={{
        "--btn-color": color,
        "--btn-hover-color": hoverColor,
      }}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded border-none bg-transparent p-1 text-[color:var(--btn-color)] transition-colors duration-150 cursor-pointer enabled:hover:text-[color:var(--btn-hover-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--btn-hover-color)]/30 disabled:cursor-default disabled:opacity-70 ${className}`}
    >
      {children}
    </button>
  );
}
