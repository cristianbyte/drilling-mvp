import { useEffect, useMemo, useState } from "react";
import SupervisorCargaExcelAction from "../components/SupervisorCargaExcelAction";
import SupervisorCargaExcelModal from "../components/SupervisorCargaExcelModal";
import SupervisorHeader from "../components/SupervisorHeader";
import SupervisorCargaDetail from "../components/SupervisorCargaDetail";
import SupervisorCargaSidebar from "../components/SupervisorCargaSidebar";
import { blastRepository } from "../di/container";
import { usePageTitle } from "../hooks/usePageTitle";

export default function SupervisorCargaView() {
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [blasts, setBlasts] = useState([]);
  const [loadingBlasts, setLoadingBlasts] = useState(true);
  const [selectedBlastId, setSelectedBlastId] = useState("");
  const [selectedBlastFull, setSelectedBlastFull] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  usePageTitle("Supervisor / Carga");
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
        setLastUpdate(Date.now());
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
        setLastUpdate(Date.now());
      })
      .catch((error) => {
        console.error(
          "Error loading blast detail for supervisor carga:",
          error,
        );
      })
      .finally(() => {
        if (mounted) setLoadingDetail(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedBlastId]);

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
