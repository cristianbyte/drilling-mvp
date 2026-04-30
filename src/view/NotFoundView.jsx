import { Link } from "react-router-dom";

export default function NotFoundView() {
  return (
    <main className="min-h-screen bg-(--color-surface-base) px-4 py-8 text-(--color-text-primary)">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center">
        <section className="w-full max-w-xl overflow-hidden rounded-[1.25rem] border border-(--color-border-subtle) bg-(--color-surface-1) shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3 border-b border-(--color-border-subtle) px-6 py-4">
            <div className="h-2 w-2 rounded-full bg-(--color-danger)" />
            <span className="font-(--font-mono) text-[0.65rem] uppercase tracking-[0.18em] text-(--color-text-muted)">
              Error
            </span>
            <span className="ml-auto font-(--font-mono) text-[0.65rem] uppercase tracking-[0.18em] text-(--color-text-faint)">
              404
            </span>
          </div>

          <div className="space-y-6 px-6 py-7 sm:px-7">
            <div className="space-y-3">
              <h1 className="font-(--font-sans) text-[2rem] font-semibold tracking-[-0.05em] text-(--color-text-primary)">
                Ruta no encontrada
              </h1>
              <div className="h-px w-16 bg-(--color-danger)" />
              <p className="max-w-lg text-sm leading-7 text-(--color-text-muted)">
                URL no corresponde a modulo disponible en sistema.
              </p>
            </div>

            <Link
              to="/"
              className="inline-flex w-full items-center justify-center rounded-[0.5rem] bg-(--color-brand-amber) px-4 py-4 font-(--font-mono) text-sm font-semibold uppercase tracking-[0.12em] text-(--color-surface-base) transition-all duration-150 hover:bg-[color:color-mix(in_srgb,var(--color-brand-amber)_82%,white)] active:scale-[0.99]"
            >
              Volver
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
