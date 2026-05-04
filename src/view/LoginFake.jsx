import { usePageTitle } from "../hooks/usePageTitle";

export default function LoginFake() {
  usePageTitle("Login");
  return (
    <main className="relative min-h-screen overflow-hidden bg-(--color-surface-base)">
      <div className="absolute inset-0 bg-(--color-surface-base)" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <section className="w-full max-w-md overflow-hidden rounded-[1.25rem] border border-(--color-border-subtle) bg-(--color-surface-1)/95 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-center gap-3 border-b border-(--color-border-subtle) px-6 py-4">
            <div className="h-2 w-2 rounded-full bg-(--color-brand-amber)" />
            <span className="font-(--font-mono) text-[0.65rem] uppercase tracking-[0.18em] text-(--color-text-muted)">
              Acceso
            </span>
            <span className="ml-auto font-(--font-mono) text-[0.65rem] uppercase tracking-[0.18em] text-(--color-text-faint)">
              FOR-PO-04
            </span>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-7 sm:py-7">
            <div className="space-y-2">
              <h1 className="text-[2rem] font-semibold tracking-tighter text-(--color-text-primary)">
                Login
              </h1>
              <div className="h-px w-16 bg-(--color-brand-amber)" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-(--font-mono) text-[0.62rem] uppercase tracking-[0.15em] text-(--color-text-muted)">
                  Usuario
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-(--color-border-default) bg-(--color-surface-2) px-4 py-3 text-sm text-(--color-text-primary) outline-none transition-colors placeholder:text-(--color-text-faint) focus:border-(--color-brand-amber)"
                  placeholder=" "
                />
              </div>

              <div>
                <label className="mb-2 block font-(--font-mono) text-[0.62rem] uppercase tracking-[0.15em] text-(--color-text-muted)">
                  Clave
                </label>
                <input
                  type="password"
                  className="w-full rounded-md border border-(--color-border-default) bg-(--color-surface-2) px-4 py-3 text-sm text-(--color-text-primary) outline-none transition-colors placeholder:text-(--color-text-faint) focus:border-(--color-brand-amber)"
                  placeholder=" "
                />
              </div>
            </div>

            <button
              type="button"
              className="w-full rounded-lg bg-(--color-brand-amber) px-4 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-(--color-surface-base) transition-all duration-150 hover:bg-[color-mix(in_srgb,var(--color-brand-amber)_82%,white)] active:scale-[0.99]"
            >
              Entrar
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
