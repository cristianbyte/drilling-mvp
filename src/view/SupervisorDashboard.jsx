import { useCallback, useEffect, useState } from "react";
import {
  supabase,
  supabaseReady,
} from "../infrastructure/supabase/supabaseClient";
import { SubscriptionManager } from "../infrastructure/supabase/SubscriptionManager";
import ExportDayModal from "../components/ExportDayModal";
import KpiCard from "../components/KpiCard";
import SupervisorHeader from "../components/SupervisorHeader";
import SupervisorExportAction from "../components/SupervisorExportAction";
import SupervisorStats from "../components/SupervisorStats";
import SupervisorTable from "../components/SupervisorTable";
import {
  formatDateTime,
  formatTime,
  getDateKey,
  getBrowserTimeZone,
  getTodayDateKey,
} from "../lib/datetime";
import { exportRowsToXlsx } from "../lib/exportXlsx";
import { usePageTitle } from "../hooks/usePageTitle";

const supervisorSubscriptionManager = new SubscriptionManager();

function sortByRecencyDesc(rows) {
  return [...rows].sort(
    (a, b) =>
      new Date(b.recency || b.updatedAt || b.createdAt || 0) -
      new Date(a.recency || a.updatedAt || a.createdAt || 0),
  );
}

function mapSupervisorChannelRow(row) {
  return {
    drillingId: row.drilling_id,
    depth: row.depth,
    ceiling: row.ceiling,
    floor: row.floor,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    holeId: row.hole_id,
    holeNumber: row.hole_number,
    blastId: row.blast_id,
    plannedDepth: row.planned_depth,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    equipment: row.equipment,
    shift: row.shift_type,
    pattern: row.pattern,
    diameter: row.diameter,
    elevation: row.elevation,
    recency: row.recency,
    date: getDateKey(row.created_at),
  };
}

async function fetchLatestSupervisorRows(limit = 50) {
  const { data, error } = await supabase
    .from("v_supervisor_holes")
    .select("*")
    .order("recency", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data || []).map(mapSupervisorChannelRow);
}

async function fetchSupervisorRowsByDate(date, timeZone) {
  const { data, error } = await supabase
    .from("v_supervisor_holes")
    .select("*")
    .order("recency", { ascending: false })
    .limit(5000);

  if (error) {
    throw error;
  }

  return (data || [])
    .map(mapSupervisorChannelRow)
    .filter((row) => getDateKey(row.createdAt, timeZone) === date);
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
    const rows = await fetchLatestSupervisorRows(50);
    setRecentRows(rows);
    setLastUpdate(Date.now());
  }, []);

  useEffect(() => {
    if (!supabaseReady) return;

    let active = true;
    let unsubscribe = () => {};

    loadDashboardData()
      .then(() => {
        if (!active) return;

        unsubscribe = supervisorSubscriptionManager.subscribeSupervisorRows(
          { limit: 50, date: selectedDate },
          () => fetchLatestSupervisorRows(50),
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

    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadDashboardData, selectedDate]);

  const latest50Rows = sortByRecencyDesc(recentRows).slice(0, 50);

  const filteredRows = latest50Rows.filter((row) => {
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

  const totalMetros = latest50Rows.reduce(
    (sum, row) => sum + Number(row.depth || 0),
    0,
  );
  const promMetros = latest50Rows.length
    ? totalMetros / latest50Rows.length
    : 0;
  const totalOps = new Set(
    latest50Rows
      .map((row) => row.operatorName)
      .filter(Boolean)
      .filter((name) => name !== "-"),
  ).size;

  const chartOpsData = Object.entries(
    latest50Rows.reduce((acc, row) => {
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

  const chartTimeData = [...latest50Rows]
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
        const exportRows = await fetchSupervisorRowsByDate(
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
        subtitle="Dashboard: ultimos 50 registros"
        title="Supervisor / Perforacion"
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-0 overflow-x-hidden px-2 py-3 sm:px-4 md:px-6 [&_.section-card]:mx-0 [&_.section-card]:w-full [&_.section-card]:min-w-0">
        <section className="section-card bg-transparent border-0 w-full min-w-0 overflow-hidden">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Metros totales"
              value={totalMetros.toFixed(1)}
              sub="ultimos 50 registros"
              color="var(--color-brand-amber)"
            />
            <KpiCard
              label="Barrenos"
              value={latest50Rows.length}
              sub="ultimos 50 registros"
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
              sub="en ultimos 50 registros"
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
              scopeLabel="ultimos 50 registros"
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
