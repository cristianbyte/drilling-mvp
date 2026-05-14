import { useCallback, useEffect, useMemo, useState } from "react";
import ExportDayModal from "../components/modals/supervisor/ExportDayModal";
import SupervisorHeader from "../components/layout/supervisor/SupervisorHeader";
import SupervisorExportAction from "../components/features/supervisor/perforacion/SupervisorExportAction";
import SupervisorCargaSidebar from "../components/features/supervisor/SupervisorCargaSidebar";
import SupervisorPerforacionDetail from "../components/features/supervisor/perforacion/SupervisorPerforacionDetail";
import { supervisorRepository } from "../di/container";
import { getBrowserTimeZone, getTodayDateKey } from "../lib/datetime";
import { exportRowsToXlsx } from "../lib/exportXlsx";
import { usePageTitle } from "../hooks/usePageTitle";

export default function SupervisorDashboard() {
  const [blasts, setBlasts] = useState([]);
  const [drillingRowsByBlastId, setDrillingRowsByBlastId] = useState({});
  const [selectedBlastId, setSelectedBlastId] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [timeZone] = useState(() => getBrowserTimeZone());
  const [selectedDate] = useState(() => getTodayDateKey(timeZone));
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState("");
  const [loadingBlasts, setLoadingBlasts] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  usePageTitle("Supervisor / Perforacion");

  const applySnapshot = useCallback((snapshot) => {
    setBlasts(snapshot.blasts);
    setDrillingRowsByBlastId(snapshot.drillingRowsByBlastId);
    setSelectedBlastId((current) => {
      if (current && snapshot.drillingRowsByBlastId[current]) {
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
  const selectedRows = useMemo(
    () => drillingRowsByBlastId[selectedBlastId] ?? [],
    [drillingRowsByBlastId, selectedBlastId],
  );

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    supervisorRepository
      .fetchDrillingSnapshot()
      .then((snapshot) => {
        if (!active) return;

        applySnapshot(snapshot);
        unsubscribe = supervisorRepository.subscribeDrillingSnapshot(
          (nextSnapshot) => {
            if (!active) return;
            applySnapshot(nextSnapshot);
          },
        );
      })
      .catch((error) => {
        console.error("Error loading supervisor dashboard:", error);
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

  const handleExport = useCallback(
    async (selectedExportDate) => {
      if (!selectedExportDate) return;

      setExporting(true);
      setExportFeedback("");

      try {
        const exportRows = await supervisorRepository.fetchDrillingRowsByDate(
          selectedExportDate,
          timeZone,
        );
        const exportedCount = exportRowsToXlsx(exportRows, selectedExportDate);

        if (exportedCount > 0) {
          setIsExportModalOpen(false);
          return;
        }

        setExportFeedback("Sin registros para fecha seleccionada.");
      } finally {
        setExporting(false);
      }
    },
    [timeZone],
  );

  return (
      <main className="min-h-screen bg-(--color-surface-base) pb-8 text-(--color-text-primary)">
        <SupervisorHeader
          accentClassName="text-(--color-brand-amber)"
        action={
          <SupervisorExportAction
            onClick={() => {
              setExportFeedback("");
              setIsExportModalOpen(true);
            }}
              disabled={false}
            />
          }
          badgeText={selectedBlast?.blastCode || null}
          detailLabel={selectedBlast ? `Ubicacion: ${selectedBlast.location}` : null}
          lastUpdate={lastUpdate}
          selectedDate={selectedDate}
          subtitle="Panel de voladuras y detalle de perforacion"
          title="Supervisor / Perforacion"
        />

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 overflow-x-hidden px-2 py-3 sm:px-4 md:px-6 lg:grid-cols-[20rem_minmax(0,1fr)] [&_.section-card]:mx-0 [&_.section-card]:w-full [&_.section-card]:min-w-0">
          <SupervisorCargaSidebar
            blasts={blasts}
            loading={loadingBlasts}
            onSelectBlast={setSelectedBlastId}
            selectedBlastId={selectedBlastId}
          />

          <SupervisorPerforacionDetail
            blast={selectedBlast}
            rows={selectedRows}
            loading={loadingDetail}
          />
        </div>

      {isExportModalOpen && (
        <ExportDayModal
          initialDate={selectedDate}
          onClose={() => {
            if (!exporting) setIsExportModalOpen(false);
          }}
          onDownload={handleExport}
          exporting={exporting}
          feedback={exportFeedback}
        />
      )}
    </main>
  );
}
