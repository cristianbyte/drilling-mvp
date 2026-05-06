import { useCallback, useEffect, useMemo, useState } from "react";
import SupervisorCargaExcelAction from "../components/SupervisorCargaExcelAction";
import SupervisorCargaExcelModal from "../components/SupervisorCargaExcelModal";
import SupervisorHeader from "../components/SupervisorHeader";
import SupervisorCargaDetail from "../components/SupervisorCargaDetail";
import SupervisorCargaSidebar from "../components/SupervisorCargaSidebar";
import { supervisorRepository } from "../di/container";
import { usePageTitle } from "../hooks/usePageTitle";

export default function SupervisorCargaView() {
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [blasts, setBlasts] = useState([]);
  const [blastFullById, setBlastFullById] = useState({});
  const [loadingBlasts, setLoadingBlasts] = useState(true);
  const [selectedBlastId, setSelectedBlastId] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  usePageTitle("Supervisor / Carga");

  const applySnapshot = useCallback((snapshot) => {
    setBlasts(snapshot.blasts);
    setBlastFullById(snapshot.blastFullById);
    setSelectedBlastId((current) => {
      if (current && snapshot.blastFullById[current]) {
        return current;
      }

      return snapshot.blasts[0]?.id || "";
    });
    setLastUpdate(Date.now());
  }, []);

  const selectedBlast = useMemo(
    () => blasts.find((blast) => blast.id === selectedBlastId) ?? null,
    [blasts, selectedBlastId],
  );
  const selectedBlastFull = useMemo(
    () => blastFullById[selectedBlastId] ?? null,
    [blastFullById, selectedBlastId],
  );

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    supervisorRepository
      .fetchLoadingSnapshot()
      .then((snapshot) => {
        if (!active) return;

        applySnapshot(snapshot);
        unsubscribe = supervisorRepository.subscribeLoadingSnapshot(
          (nextSnapshot) => {
            if (!active) return;
            applySnapshot(nextSnapshot);
          },
        );
      })
      .catch((error) => {
        console.error("Error loading supervisor carga snapshot:", error);
      })
      .finally(() => {
        if (!active) return;
        setLoadingBlasts(false);
        setLoadingDetail(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [applySnapshot]);

  return (
    <>
      <main className="min-h-screen bg-(--color-surface-base) pb-8 text-(--color-text-primary)">
        <SupervisorHeader
          accentClassName="text-(--color-brand-cyan)"
          action={
            <SupervisorCargaExcelAction
              onClick={() => setExcelModalOpen(true)}
            />
          }
          badgeText={selectedBlast?.blastCode || null}
          detailLabel={
            selectedBlast ? `Ubicacion: ${selectedBlast.location}` : null
          }
          lastUpdate={lastUpdate}
          subtitle="Panel de voladuras y detalle de carga"
          title="Supervisor / Carga"
        />

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

      {excelModalOpen ? (
        <SupervisorCargaExcelModal
          blastFull={selectedBlastFull}
          loading={loadingDetail}
          onClose={() => setExcelModalOpen(false)}
        />
      ) : null}
    </>
  );
}
