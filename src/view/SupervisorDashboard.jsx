import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDatabase, ref, remove } from 'firebase/database'
import {
  fetchHolesByShiftIds,
  fetchShiftsByDate,
  fetchShiftsByIds,
  firebaseReady,
  subscribeRecentHoles,
} from '../lib/firebase'
import Card from '../components/Card'
import ConfirmModal from '../components/ConfirmModal'
import ExportDayModal from '../components/ExportDayModal'
import KpiCard from '../components/KpiCard'
import SupervisorHeader from '../components/SupervisorHeader'
import SupervisorStats from '../components/SupervisorStats'
import SupervisorTable from '../components/SupervisorTable'
import { exportRowsToXlsx } from '../lib/exportXlsx'

function todayDate() {
  return new Date().toLocaleDateString('sv-SE')
}

function fmtTime(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function buildRows(holesEntries, shifts) {
  return holesEntries.map(([holeId, hole]) => {
    const shift = shifts[hole.shiftId] || null

    return {
      holeId,
      ...hole,
      location: shift?.location ?? '-',
      operatorName: shift?.operatorName ?? '-',
      equipment: shift?.equipment ?? '-',
      blastId: shift?.blastId ?? '-',
      shift: shift?.shift ?? '-',
      date: shift?.date ?? hole.date ?? '',
      diameter: shift?.diameter ?? null,
      elevation: shift?.elevation ?? null,
      pattern: shift?.pattern ?? '',
    }
  })
}

function sortByCreatedAtDesc(rows) {
  return [...rows].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export default function SupervisorDashboard() {
  const [recentHoles, setRecentHoles] = useState({})
  const [recentShifts, setRecentShifts] = useState({})
  const [lastUpdate, setLastUpdate] = useState(null)
  const [selectedDate] = useState(todayDate)
  const [filtroTurno, setFiltroTurno] = useState('TODOS')
  const [filtroOp, setFiltroOp] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportFeedback, setExportFeedback] = useState('')

  useEffect(() => {
    if (!firebaseReady) return

    const unsubRecentHoles = subscribeRecentHoles(50, async nextHoles => {
      setRecentHoles(nextHoles)
      const shiftIds = [...new Set(Object.values(nextHoles).map(hole => hole?.shiftId).filter(Boolean))]
      const nextShifts = await fetchShiftsByIds(shiftIds)
      setRecentShifts(nextShifts)
      setLastUpdate(Date.now())
    })

    return () => unsubRecentHoles()
  }, [])

  const recentRows = buildRows(Object.entries(recentHoles), recentShifts)
  const latest50Rows = sortByCreatedAtDesc(recentRows).slice(0, 50)

  const filteredRows = latest50Rows.filter(row => {
    const turnoOk = filtroTurno === 'TODOS' || row.shift === filtroTurno
    const opOk = !filtroOp || (row.operatorName || '').toLowerCase().includes(filtroOp.toLowerCase())
    return turnoOk && opOk
  })

  const tableRows = [...filteredRows]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 50)

  const totalMetros = latest50Rows.reduce((sum, row) => sum + Number(row.depth || 0), 0)
  const promMetros = latest50Rows.length ? totalMetros / latest50Rows.length : 0
  const totalOps = new Set(
    latest50Rows
      .map(row => row.operatorName)
      .filter(Boolean)
      .filter(name => name !== '-')
  ).size

  const chartOpsData = Object.entries(
    latest50Rows.reduce((acc, row) => {
      const operator = row.operatorName && row.operatorName !== '-' ? row.operatorName : 'Sin nombre'
      acc[operator] = (acc[operator] || 0) + Number(row.depth || 0)
      return acc
    }, {})
  ).map(([operator, metros]) => ({
    op: operator.split(' ')[0],
    metros: parseFloat(metros.toFixed(1)),
  }))

  const chartTimeData = (() => {
    let acum = 0
    return [...latest50Rows]
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .map(row => {
        acum += Number(row.depth || 0)
        return {
          hora: fmtTime(row.createdAt),
          acum: parseFloat(acum.toFixed(1)),
        }
      })
  })()

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    await remove(ref(getDatabase(), `holes/${deleteTarget.holeId}`))
    setDeleteTarget(null)
  }, [deleteTarget])

  const handleExport = useCallback(async selectedExportDate => {
    if (!selectedExportDate) return

    setExporting(true)
    setExportFeedback('')

    try {
      const exportShifts = await fetchShiftsByDate(selectedExportDate)
      const exportShiftIds = Object.keys(exportShifts)
      const exportHoles = await fetchHolesByShiftIds(exportShiftIds)
      const exportRows = buildRows(Object.entries(exportHoles), exportShifts)
      const exportedCount = exportRowsToXlsx(exportRows, selectedExportDate)

      if (exportedCount > 0) {
        setIsExportModalOpen(false)
        return
      }

      setExportFeedback('Sin registros para fecha seleccionada.')
    } finally {
      setExporting(false)
    }
  }, [])

  return (
    <div style={{ background: 'var(--color-surface-base)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      <SupervisorHeader
        lastUpdate={lastUpdate}
        selectedDate={selectedDate}
        onOpenExport={() => {
          setExportFeedback('')
          setIsExportModalOpen(true)
        }}
        exportDisabled={false}
      />

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <KpiCard label="Metros totales" value={totalMetros.toFixed(1)} sub="ultimos 50 registros" color="var(--color-brand-amber)" />
          <KpiCard label="Barrenos" value={latest50Rows.length} sub="ultimos 50 registros" color="var(--color-brand-cyan)" />
          <KpiCard label="Prof. promedio" value={promMetros ? promMetros.toFixed(1) : '-'} sub="metros por barreno" color="var(--color-brand-emerald)" />
          <KpiCard label="Operadores" value={totalOps} sub="en ultimos 50 registros" color="var(--color-text-muted)" />
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
            fmtTime={fmtTime}
          />
        </Card>
      </div>

      {deleteTarget?.holeId && (
        <ConfirmModal
          danger
          title="Eliminar barreno"
          rows={[
            { key: 'Barreno', val: `B-${String(deleteTarget?.holeNumber || 0).padStart(2, '0')}` },
            { key: 'Operador', val: deleteTarget?.operatorName || '-' },
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
            if (!exporting) setIsExportModalOpen(false)
          }}
          onDownload={handleExport}
          exporting={exporting}
          feedback={exportFeedback}
        />
      )}
    </div>
  )
}
