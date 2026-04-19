import { useState, useEffect, useCallback } from 'react'
import { getDatabase, ref, onValue, remove } from 'firebase/database'
import { firebaseReady } from '../lib/firebase'
import ConfirmModal from '../components/ConfirmModal'
import Card from '../components/Card'
import KpiCard from '../components/KpiCard'
import SupervisorHeader from '../components/SupervisorHeader'
import SupervisorStats from '../components/SupervisorStats'
import SupervisorTable from '../components/SupervisorTable'

// ─── helpers ──────────────────────────────────────────────────────────────────
function within24h(ts) {
  if (!ts) return false
  const d = typeof ts === 'number' ? ts : Date.now()
  return Date.now() - d < 24 * 60 * 60 * 1000
}

function fmtTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function buildRows(holes, shifts) {
  return holes.map(([holeId, h]) => ({
    holeId,
    ...h,
    ...(shifts[h.shiftId] || {}),
  }))
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function SupervisorDashboard() {
  const [holes, setHoles]           = useState({})
  const [shifts, setShifts]         = useState({})
  const [lastUpdate, setLastUpdate] = useState(null)
  const [filtroTurno, setFiltroTurno] = useState('TODOS')
  const [filtroOp, setFiltroOp]       = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    if (!firebaseReady) return
    const db = getDatabase()
    const unsubHoles  = onValue(ref(db, 'holes'),  snap => { setHoles(snap.val() || {});  setLastUpdate(Date.now()) })
    const unsubShifts = onValue(ref(db, 'shifts'), snap => setShifts(snap.val() || {}))
    return () => { unsubHoles(); unsubShifts() }
  }, [])

  const allRows  = buildRows(Object.entries(holes), shifts)
  const rows24h  = allRows.filter(r => within24h(r.createdAt))

  const filteredRows = allRows.filter(r => {
    const turnoOk = filtroTurno === 'TODOS' || r.shift === filtroTurno
    const opOk    = !filtroOp || (r.operatorName || '').toLowerCase().includes(filtroOp.toLowerCase())
    return turnoOk && opOk
  })

  const tableRows = [...filteredRows]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 50)

  const totalMetros = rows24h.reduce((s, r) => s + Number(r.depth || 0), 0)
  const promMetros  = rows24h.length ? totalMetros / rows24h.length : 0
  const totalOps    = new Set(rows24h.map(r => r.operatorName)).size

  const chartOpsData = Object.entries(
    rows24h.reduce((acc, r) => {
      const op = r.operatorName || 'Sin nombre'
      acc[op] = (acc[op] || 0) + Number(r.depth || 0)
      return acc
    }, {})
  ).map(([op, metros]) => ({ op: op.split(' ')[0], metros: parseFloat(metros.toFixed(1)) }))

  const chartTimeData = (() => {
    let acum = 0
    return [...rows24h]
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .map(r => {
        acum += Number(r.depth || 0)
        return { hora: fmtTime(r.createdAt), acum: parseFloat(acum.toFixed(1)) }
      })
  })()

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    await remove(ref(getDatabase(), `holes/${deleteTarget.holeId}`))
    setDeleteTarget(null)
  }, [deleteTarget])

  return (
    <div style={{ background: 'var(--color-surface-base)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>

      <SupervisorHeader lastUpdate={lastUpdate} />

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <KpiCard label="Metros totales"  value={totalMetros.toFixed(1)}                   sub="últimas 24 h"     color="var(--color-brand-amber)" />
          <KpiCard label="Barrenos"        value={rows24h.length}                            sub="últimas 24 h"     color="var(--color-brand-cyan)" />
          <KpiCard label="Prof. promedio"  value={promMetros ? promMetros.toFixed(1) : '—'}  sub="metros / barreno" color="var(--color-brand-emerald)" />
          <KpiCard label="Operadores"      value={totalOps}                                  sub="activos hoy"      color="var(--color-text-muted)" />
        </div>

        <SupervisorStats chartOpsData={chartOpsData} chartTimeData={chartTimeData} />

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
            { key: 'Barreno',  val: `B-${String(deleteTarget?.holeNumber || 0).padStart(2, '0')}` },
            { key: 'Operador', val: deleteTarget?.operatorName || '—' },
          ]}
          confirmLabel="Eliminar"
          correctLabel="Cancelar"
          onConfirm={handleDeleteConfirm}
          onCorrect={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}