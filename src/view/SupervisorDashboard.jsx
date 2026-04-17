import { useState, useEffect, useRef, useCallback } from 'react'
import { getDatabase, ref, onValue, remove } from 'firebase/database'
import { firebaseReady } from '../lib/firebase'
import ConfirmModal from '../components/ConfirmModal'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

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

const TICK_STYLE = { fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--color-text-muted)' }

// ─── sub-components ───────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--color-surface-1)',
      border: '1px solid var(--color-border-default)',
      borderRadius: 'var(--radius-card)',
      padding: '16px 18px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: color,
      }} />
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        color: 'var(--color-text-muted)', marginBottom: 10,
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 500,
        color, lineHeight: 1,
      }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>{sub}</div>
    </div>
  )
}

function Tag({ turno }) {
  const isDia = turno === 'DIA'
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10,
      padding: '3px 8px', borderRadius: 4,
      fontWeight: 500, textTransform: 'uppercase',
      background: isDia ? 'var(--color-brand-amber-dim)' : 'var(--color-brand-cyan-dim)',
      color: isDia ? 'var(--color-brand-amber)' : 'var(--color-brand-cyan)',
    }}>{turno}</span>
  )
}

function FilterBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'var(--color-brand-amber-dim)' : 'transparent',
      border: `1px solid ${active ? 'var(--color-brand-amber)' : 'var(--color-border-default)'}`,
      borderRadius: 'var(--radius-input)',
      color: active ? 'var(--color-brand-amber)' : 'var(--color-text-muted)',
      fontFamily: 'var(--font-mono)', fontSize: 11,
      padding: '7px 14px', cursor: 'pointer',
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>{label}</button>
  )
}

function Card({ title, children }) {
  return (
    <div style={{
      background: 'var(--color-surface-1)',
      border: '1px solid var(--color-border-default)',
      borderRadius: 'var(--radius-card)',
      padding: 18,
    }}>
      {title && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'var(--color-text-muted)', marginBottom: 16,
        }}>{title}</div>
      )}
      {children}
    </div>
  )
}

function LiveBadge() {
  const dotRef = useRef(null)
  useEffect(() => {
    const el = dotRef.current
    if (!el) return
    const id = setInterval(() => {
      el.style.opacity = el.style.opacity === '0.2' ? '1' : '0.2'
    }, 750)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'color-mix(in srgb, var(--color-brand-emerald) 12%, transparent)',
      border: '1px solid color-mix(in srgb, var(--color-brand-emerald) 35%, transparent)',
      borderRadius: 'var(--radius-pill)',
      padding: '4px 12px',
      fontFamily: 'var(--font-mono)', fontSize: 11,
      color: 'var(--color-brand-emerald)',
      textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>
      <div
        ref={dotRef}
        style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--color-brand-emerald)',
          transition: 'opacity 0.3s',
        }}
      />
      En vivo
    </div>
  )
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

      <header style={{
        background: 'var(--color-surface-1)',
        borderBottom: '1px solid var(--color-border-default)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 13,
          color: 'var(--color-brand-amber)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          Supervisor · Perforación
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <LiveBadge />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
            {lastUpdate
              ? `Actualizado ${new Date(lastUpdate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : '—'}
          </div>
        </div>
      </header>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <KpiCard label="Metros totales"  value={totalMetros.toFixed(1)}                   sub="últimas 24 h"     color="var(--color-brand-amber)" />
          <KpiCard label="Barrenos"        value={rows24h.length}                            sub="últimas 24 h"     color="var(--color-brand-cyan)" />
          <KpiCard label="Prof. promedio"  value={promMetros ? promMetros.toFixed(1) : '—'}  sub="metros / barreno" color="var(--color-brand-emerald)" />
          <KpiCard label="Operadores"      value={totalOps}                                  sub="activos hoy"      color="var(--color-text-muted)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card title="Metros por operador (24 h)">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartOpsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="op" tick={TICK_STYLE} />
                <YAxis tick={TICK_STYLE} />
                <Tooltip contentStyle={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                <Bar dataKey="metros" radius={[4, 4, 0, 0]} fill="var(--color-brand-amber)" fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Acumulado en el tiempo (24 h)">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartTimeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="hora" tick={TICK_STYLE} interval="preserveStartEnd" />
                <YAxis tick={TICK_STYLE} />
                <Tooltip contentStyle={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                <Line
                  type="monotone" dataKey="acum"
                  stroke="var(--color-brand-emerald)" strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--color-brand-emerald)' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'var(--color-text-muted)',
            }}>Últimos registros (máx 50)</span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { key: 'TODOS', label: 'Todos' },
                { key: 'DIA',   label: 'Día' },
                { key: 'NOCHE', label: 'Noche' },
              ].map(({ key, label }) => (
                <FilterBtn key={key} label={label} active={filtroTurno === key} onClick={() => setFiltroTurno(key)} />
              ))}
              <input
                value={filtroOp}
                onChange={e => setFiltroOp(e.target.value)}
                placeholder="Buscar operador…"
                style={{
                  background: 'var(--color-surface-base)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-input)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                  padding: '7px 12px', outline: 'none', width: 160,
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                  {['Barreno', 'Operador', 'Equipo', 'Voladura', 'Prof.', 'Turno', 'Hora', ''].map((h, i) => (
                    <th key={i} style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      color: 'var(--color-text-muted)',
                      padding: '8px 12px', textAlign: 'left', fontWeight: 400,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{
                      textAlign: 'center', padding: 40,
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-mono)', fontSize: 13,
                    }}>Sin registros para este filtro</td>
                  </tr>
                ) : tableRows.map((r, i) => (
                  <tr
                    key={r.holeId}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      background: i === 0 ? 'var(--color-brand-amber-dim)' : 'transparent',
                    }}
                  >
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand-amber)', fontSize: 13, padding: '10px 12px' }}>
                      B-{String(r.holeNumber || 0).padStart(2, '0')}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-text-primary)' }}>{r.operatorName || '—'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.equipment || '—'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.blastId || '—'}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--color-brand-cyan)' }}>
                      {Number(r.depth || 0).toFixed(1)} m
                    </td>
                    <td style={{ padding: '10px 12px' }}><Tag turno={r.shift || '—'} /></td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {fmtTime(r.createdAt)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button
                        onClick={() => setDeleteTarget({
                          holeId: r.holeId,
                          holeNumber: r.holeNumber,
                          operatorName: r.operatorName,
                        })}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--color-danger)',
                          borderRadius: 'var(--radius-btn)',
                          color: 'var(--color-danger)',
                          fontFamily: 'var(--font-mono)', fontSize: 10,
                          padding: '4px 10px', cursor: 'pointer',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}
                      >Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>

      {deleteTarget && (
        <ConfirmModal
          danger
          title="Eliminar barreno"
          rows={[
            { label: 'Barreno',  value: `B-${String(deleteTarget.holeNumber || 0).padStart(2, '0')}` },
            { label: 'Operador', value: deleteTarget.operatorName || '—' },
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