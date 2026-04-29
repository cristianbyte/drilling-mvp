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
      className={`flex items-center rounded border-none bg-transparent p-1 text-[color:var(--btn-color)] transition-colors duration-150 cursor-pointer enabled:hover:text-[color:var(--btn-hover-color)] disabled:cursor-default disabled:opacity-70 ${className}`}
    >
      {children}
    </button>
  );
}
