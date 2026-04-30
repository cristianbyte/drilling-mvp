import { useEffect, useMemo, useState } from "react";
import SupervisorCargaDetail from "../components/SupervisorCargaDetail";
import SupervisorCargaSidebar from "../components/SupervisorCargaSidebar";
import { blastRepository } from "../di/container";

export default function SupervisorCargaView() {
  const [blasts, setBlasts] = useState([]);
  const [loadingBlasts, setLoadingBlasts] = useState(true);
  const [selectedBlastId, setSelectedBlastId] = useState("");
  const [selectedBlastFull, setSelectedBlastFull] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const selectedBlast = useMemo(
    () => blasts.find((blast) => blast.id === selectedBlastId) ?? null,
    [blasts, selectedBlastId],
  );

  useEffect(() => {
    let mounted = true;

    blastRepository
      .fetchAllBlasts()
      .then((data) => {
        if (!mounted) return;

        setBlasts(data);
        setSelectedBlastId((current) => current || data[0]?.id || "");
      })
      .catch((error) => {
        console.error("Error loading blasts for supervisor carga:", error);
      })
      .finally(() => {
        if (mounted) setLoadingBlasts(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedBlastId) {
      setSelectedBlastFull(null);
      return;
    }

    let mounted = true;
    setLoadingDetail(true);

    blastRepository
      .fetchBlastFullLoading(selectedBlastId)
      .then((data) => {
        if (!mounted) return;
        setSelectedBlastFull(data);
      })
      .catch((error) => {
        console.error("Error loading blast detail for supervisor carga:", error);
      })
      .finally(() => {
        if (mounted) setLoadingDetail(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedBlastId]);

  return (
    <main className="min-h-screen bg-(--color-surface-base) pb-8 text-(--color-text-primary)">
      <header className="sticky top-0 z-10 border-b border-(--color-border-subtle) bg-(--color-surface-1)/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2">
          <span className="font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.18em] text-(--color-text-muted)">
            Supervisor
          </span>
          <span className="font-(--font-mono) text-(--color-border-strong)">
            /
          </span>
          <span className="font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.18em] text-(--color-brand-cyan)">
            Carga
          </span>
          {selectedBlast && (
            <span className="ml-auto font-(--font-mono) text-[0.625rem] uppercase tracking-[0.12em] text-(--color-text-muted)">
              {selectedBlast.blastCode}
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 overflow-x-hidden px-2 py-3 sm:px-4 md:px-6 lg:grid-cols-[20rem_minmax(0,1fr)] [&_.section-card]:mx-0 [&_.section-card]:w-full [&_.section-card]:min-w-0">
        <SupervisorCargaSidebar
          blasts={blasts}
          loading={loadingBlasts}
          onSelectBlast={setSelectedBlastId}
          selectedBlastId={selectedBlastId}
        />

        <SupervisorCargaDetail
          blastFull={selectedBlastFull}
          loading={loadingDetail}
        />
      </div>
    </main>
  );
}
