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
      style={{
        color: disabled ? "var(--color-text-disabled)" : color,
      }}
      disabled={disabled}
      className="flex items-center p-1 rounded bg-transparent border-none
       transition-colors duration-150 disabled:cursor-default 
       cursor-pointer disabled:opacity-70 text-(--btn-color) enabled:hover:text-(--btn-hover-color)"
    >
      {children}
    </button>
  );
}
