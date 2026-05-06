import { useCallback, useEffect, useState } from "react";
import ExportDayModal from "../components/ExportDayModal";
import KpiCard from "../components/KpiCard";
import SupervisorHeader from "../components/SupervisorHeader";
import SupervisorExportAction from "../components/SupervisorExportAction";
import SupervisorStats from "../components/SupervisorStats";
import SupervisorTable from "../components/SupervisorTable";
import { supervisorRepository } from "../di/container";
import {
  formatDateTime,
  formatTime,
  getBrowserTimeZone,
  getTodayDateKey,
} from "../lib/datetime";
import { exportRowsToXlsx } from "../lib/exportXlsx";
import { usePageTitle } from "../hooks/usePageTitle";

function sortByRecencyDesc(rows) {
  return [...rows].sort(
    (a, b) =>
      new Date(b.recency || b.updatedAt || b.createdAt || 0) -
      new Date(a.recency || a.updatedAt || a.createdAt || 0),
  );
}

export default function SupervisorDashboard() {
  const [recentRows, setRecentRows] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [timeZone] = useState(() => getBrowserTimeZone());
  const [selectedDate] = useState(() => getTodayDateKey(timeZone));
  const [filtroTurno, setFiltroTurno] = useState("TODOS");
  const [filtroOp, setFiltroOp] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState("");

  usePageTitle("Supervisor / Perforacion");
  const loadDashboardData = useCallback(async () => {
    const rows = await supervisorRepository.fetchLatestDrillingRows(100);
    setRecentRows(rows);
    setLastUpdate(Date.now());
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    const timeoutId = window.setTimeout(() => {
      loadDashboardData()
        .then(() => {
          if (!active) return;

          unsubscribe = supervisorRepository.subscribeDrillingRows(
            { limit: 100, date: selectedDate },
            (rows) => {
              if (!active) return;
              setRecentRows(rows);
              setLastUpdate(Date.now());
            },
          );
        })
        .catch((error) => {
          console.error("Error loading supervisor dashboard:", error);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [loadDashboardData, selectedDate]);

  const latest100Rows = sortByRecencyDesc(recentRows).slice(0, 100);

  const filteredRows = latest100Rows.filter((row) => {
    const turnoOk = filtroTurno === "TODOS" || row.shift === filtroTurno;
    const opOk =
      !filtroOp ||
      (row.operatorName || "").toLowerCase().includes(filtroOp.toLowerCase());
    return turnoOk && opOk;
  });

  const tableRows = [...filteredRows]
    .sort(
      (a, b) =>
        new Date(b.recency || b.updatedAt || b.createdAt || 0) -
        new Date(a.recency || a.updatedAt || a.createdAt || 0),
    )
    .slice(0, 50);

  const totalMetros = latest100Rows.reduce(
    (sum, row) => sum + Number(row.depth || 0),
    0,
  );
  const promMetros = latest100Rows.length
    ? totalMetros / latest100Rows.length
    : 0;
  const totalOps = new Set(
    latest100Rows
      .map((row) => row.operatorName)
      .filter(Boolean)
      .filter((name) => name !== "-"),
  ).size;

  const chartOpsData = Object.entries(
    latest100Rows.reduce((acc, row) => {
      const operator =
        row.operatorName && row.operatorName !== "-"
          ? row.operatorName
          : "Sin nombre";
      acc[operator] = (acc[operator] || 0) + Number(row.depth || 0);
      return acc;
    }, {}),
  ).map(([operator, metros]) => ({
    op: operator.split(" ")[0],
    metros: parseFloat(metros.toFixed(1)),
  }));

  const chartTimeData = [...latest100Rows]
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    .reduce((acc, row) => {
      const prev = acc.length ? acc[acc.length - 1].acum : 0;
      acc.push({
        hora: formatTime(row.createdAt, timeZone),
        acum: parseFloat((prev + Number(row.depth || 0)).toFixed(1)),
      });
      return acc;
    }, []);

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
        lastUpdate={lastUpdate}
        selectedDate={selectedDate}
        subtitle="Dashboard: ultimos 100 registros"
        title="Supervisor / Perforacion"
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-0 overflow-x-hidden px-2 py-3 sm:px-4 md:px-6 [&_.section-card]:mx-0 [&_.section-card]:w-full [&_.section-card]:min-w-0">
        <section className="section-card bg-transparent border-0 w-full min-w-0 overflow-hidden">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Metros totales"
              value={totalMetros.toFixed(1)}
              sub="ultimos 100 registros"
              color="var(--color-brand-amber)"
            />
            <KpiCard
              label="Barrenos"
              value={latest100Rows.length}
              sub="ultimos 100 registros"
              color="var(--color-brand-cyan)"
            />
            <KpiCard
              label="Prof. promedio"
              value={promMetros ? promMetros.toFixed(1) : "-"}
              sub="metros por barreno"
              color="var(--color-brand-emerald)"
            />
            <KpiCard
              label="Operadores"
              value={totalOps}
              sub="en ultimos 100 registros"
              color="var(--color-text-muted)"
            />
          </div>
        </section>

        <section className="section-card w-full min-w-0 overflow-hidden">
          <div className="section-header">
            <div className="dot bg-(--color-brand-emerald)" />
            <span className="section-title">Registros</span>
          </div>

          <div className="p-4 sm:p-5">
            <SupervisorTable
              tableRows={tableRows}
              filtroTurno={filtroTurno}
              setFiltroTurno={setFiltroTurno}
              filtroOp={filtroOp}
              setFiltroOp={setFiltroOp}
              fmtDateTime={(value) => formatDateTime(value, timeZone)}
            />
          </div>
        </section>

        <section className="section-card w-full min-w-0 overflow-hidden">
          <div className="section-header">
            <div className="dot bg-(--color-brand-cyan)" />
            <span className="section-title">Tendencias</span>
          </div>

          <div className="p-4 sm:p-5">
            <SupervisorStats
              chartOpsData={chartOpsData}
              chartTimeData={chartTimeData}
              scopeLabel="ultimos 100 registros"
            />
          </div>
        </section>
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
