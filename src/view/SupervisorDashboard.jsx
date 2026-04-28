import { useCallback, useEffect, useState } from "react";
import { blastRepository, holeRepository } from "../di/container";
import { supabaseReady } from "../infrastructure/supabase/supabaseClient";
import Card from "../components/Card";
import ConfirmModal from "../components/ConfirmModal";
import ExportDayModal from "../components/ExportDayModal";
import KpiCard from "../components/KpiCard";
import SupervisorHeader from "../components/SupervisorHeader";
import SupervisorStats from "../components/SupervisorStats";
import SupervisorTable from "../components/SupervisorTable";
import { formatTime, getBrowserTimeZone, getTodayDateKey } from "../lib/datetime";
import { exportRowsToXlsx } from "../lib/exportXlsx";

function sortByCreatedAtDesc(rows) {
  return [...rows].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export default function SupervisorDashboard() {
  const [recentRows, setRecentRows] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [timeZone] = useState(() => getBrowserTimeZone());
  const [selectedDate] = useState(() => getTodayDateKey(timeZone));
  const [filtroTurno, setFiltroTurno] = useState("TODOS");
  const [filtroOp, setFiltroOp] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState("");

  const loadDashboardData = useCallback(async () => {
    const rows = await holeRepository.fetchSupervisorRows({ limit: 50 });
    setRecentRows(rows);
    setLastUpdate(Date.now());
  }, []);

  useEffect(() => {
    if (!supabaseReady) return;

    const timeoutId = window.setTimeout(() => {
      loadDashboardData().catch((error) => {
        console.error("Error loading supervisor dashboard:", error);
      });
    }, 0);

    const unsubRecentRows = holeRepository.subscribeSupervisorRows(
      { limit: 50 },
      async (rows) => {
        setRecentRows(rows);
        setLastUpdate(Date.now());
      },
    );
    const unsubBlastsByDate = blastRepository.subscribeBlastsByDate(
      selectedDate,
      () => {
        loadDashboardData().catch((error) => {
          console.error("Error refreshing dashboard from blast update:", error);
        });
      },
    );

    return () => {
      window.clearTimeout(timeoutId);
      unsubRecentRows();
      unsubBlastsByDate();
    };
  }, [loadDashboardData, selectedDate]);

  const latest50Rows = sortByCreatedAtDesc(recentRows).slice(0, 50);

  const filteredRows = latest50Rows.filter((row) => {
    const turnoOk = filtroTurno === "TODOS" || row.shift === filtroTurno;
    const opOk =
      !filtroOp ||
      (row.operatorName || "").toLowerCase().includes(filtroOp.toLowerCase());
    return turnoOk && opOk;
  });

  const tableRows = [...filteredRows]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
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
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .reduce((acc, row) => {
      const prev = acc.length ? acc[acc.length - 1].acum : 0;
      acc.push({
        hora: formatTime(row.createdAt, timeZone),
        acum: parseFloat((prev + Number(row.depth || 0)).toFixed(1)),
      });
      return acc;
    }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    await holeRepository.deleteHole(deleteTarget.holeId);
    setDeleteTarget(null);
  }, [deleteTarget]);

  const handleExport = useCallback(async (selectedExportDate) => {
    if (!selectedExportDate) return;

    setExporting(true);
    setExportFeedback("");

    try {
      const exportRows = await holeRepository.fetchSupervisorRows({
        date: selectedExportDate,
        timeZone,
      });
      const exportedCount = exportRowsToXlsx(
        exportRows,
        selectedExportDate,
        timeZone,
      );

      if (exportedCount > 0) {
        setIsExportModalOpen(false);
        return;
      }

      setExportFeedback("Sin registros para fecha seleccionada.");
    } finally {
      setExporting(false);
    }
  }, [timeZone]);

  return (
    <div
      style={{
        background: "var(--color-surface-base)",
        minHeight: "100vh",
        fontFamily: "var(--font-sans)",
      }}
    >
      <SupervisorHeader
        lastUpdate={lastUpdate}
        selectedDate={selectedDate}
        onOpenExport={() => {
          setExportFeedback("");
          setIsExportModalOpen(true);
        }}
        exportDisabled={false}
      />

      <div
        style={{
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
          }}
        >
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

        <SupervisorStats
          chartOpsData={chartOpsData}
          chartTimeData={chartTimeData}
          scopeLabel="ultimos 50 registros"
        />

        <Card>
          <SupervisorTable
            tableRows={tableRows}
            filtroTurno={filtroTurno}
            setFiltroTurno={setFiltroTurno}
            filtroOp={filtroOp}
            setFiltroOp={setFiltroOp}
            setDeleteTarget={setDeleteTarget}
            fmtTime={(value) => formatTime(value, timeZone)}
          />
        </Card>
      </div>

      {deleteTarget?.holeId && (
        <ConfirmModal
          danger
          title="Eliminar barreno"
          rows={[
            {
              key: "Barreno",
              val: `B-${String(deleteTarget?.holeNumber || 0).padStart(2, "0")}`,
            },
            { key: "Operador", val: deleteTarget?.operatorName || "-" },
          ]}
          confirmLabel="Eliminar"
          correctLabel="Cancelar"
          onConfirm={handleDeleteConfirm}
          onCorrect={() => setDeleteTarget(null)}
        />
      )}

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
    </div>
  );
}
