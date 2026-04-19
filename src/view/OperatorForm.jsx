import { useCallback, useEffect, useRef, useState } from 'react'
import HoleLog from '../components/HoleLog'
import Toast, { showToast, useToast } from '../components/Toast'
import { deleteHole, firebaseReady, holeExists, shiftExists, upsertHole, upsertShift } from '../lib/firebase'
import { createClientId } from '../lib/ids'
import {
  clearAllRecords,
  clearOperatorSnapshot,
  deleteRecord,
  getPendingRecords,
  loadOperatorSnapshot,
  markRecordSynced,
  saveOperatorSnapshot,
  saveRecord,
} from '../lib/offlineStore'
import ShiftHeader from '../components/ShiftHeader'
import HoleEntry from '../components/HoleEntry'

function buildSnapshot(shift, holes) {
  return { shift, holes, savedAt: Date.now() }
}

export default function OperatorForm() {
  const [shift, setShift] = useState(null)
  const [holes, setHoles] = useState([])
  const [hydrated, setHydrated] = useState(false)
  const [headerKey, setHeaderKey] = useState(0)
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const syncingRef = useRef(false)
  const toastState = useToast()

  const syncPendingRecords = useCallback(async (manual = false) => {
    if (syncingRef.current) return
    if (!window.navigator.onLine || !firebaseReady) {
      if (manual) showToast('Sin conexión para sincronizar')
      return
    }

    syncingRef.current = true
    setSyncing(true)

    try {
      const pending = await getPendingRecords()
      if (!pending.length) {
        if (manual) showToast('Todo está sincronizado')
        return
      }

      let latestShift = null
      const syncedHoleIds = []

      for (const record of pending) {
        if (record.kind === 'shift') {
          const { shiftId, synced, ...shiftData } = record.data
          const alreadyExists = await shiftExists(record.id)
          if (!alreadyExists) {
            await upsertShift(record.id, shiftData)
          }
          await markRecordSynced(record.id)
          latestShift = { ...record.data, synced: true, shiftId: record.id }
        }

        if (record.kind === 'hole') {
          const { shiftId, holeId, synced, ...holeData } = record.data
          const alreadyExists = await holeExists(record.id)
          if (!alreadyExists) {
            await upsertHole(record.id, shiftId, holeData)
          }
          await markRecordSynced(record.id)
          syncedHoleIds.push(record.id)
        }
      }

      if (latestShift) {
        setShift(prev => prev && prev.shiftId === latestShift.shiftId ? latestShift : prev)
      }

      if (syncedHoleIds.length) {
        setHoles(prev => prev.map(h => syncedHoleIds.includes(h.holeId) ? { ...h, synced: true } : h))
      }

      if (manual) {
        showToast('Registros sincronizados')
      }
    } catch (error) {
      console.error('Pending sync failed:', error)
      if (manual) {
        showToast('Falló la sincronización')
      }
    } finally {
      syncingRef.current = false
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    loadOperatorSnapshot()
      .then(snapshot => {
        if (!active || !snapshot) return
        setShift(snapshot.shift || null)
        setHoles(Array.isArray(snapshot.holes) ? snapshot.holes : [])
      })
      .catch(error => {
        console.error('Offline restore failed:', error)
      })
      .finally(() => {
        if (active) setHydrated(true)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }

    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return

    if (!shift && holes.length === 0) {
      clearOperatorSnapshot().catch(error => {
        console.error('Offline clear failed:', error)
      })
      return
    }

    saveOperatorSnapshot(buildSnapshot(shift, holes)).catch(error => {
      console.error('Offline save failed:', error)
    })
  }, [shift, holes, hydrated])

  const pendingSyncCount =
    (shift && !shift.synced ? 1 : 0) +
    holes.filter(h => !h.synced).length

  useEffect(() => {
    if (!hydrated || !isOnline || pendingSyncCount === 0) return
    syncPendingRecords()
  }, [hydrated, isOnline, pendingSyncCount, syncPendingRecords])

  const totalMeters = holes.reduce((sum, h) => sum + h.depth, 0)
  const nextHoleNumber = holes.length + 1

  async function handleShiftFrozen(shiftData) {
    const localShift = { ...shiftData, synced: false, shiftId: shiftData.shiftId || createClientId('shift') }
    setShift(localShift)

    await saveRecord({
      id: localShift.shiftId,
      kind: 'shift',
      data: localShift,
      synced: 0,
      createdAt: Date.now(),
    })
  }

  async function handleHoleSaved(hole) {
    if (!shift) return

    const localHole = {
      ...hole,
      shiftId: shift.shiftId,
      synced: false,
    }
    setHoles(prev => [...prev, localHole])

    await saveRecord({
      id: localHole.holeId,
      kind: 'hole',
      data: localHole,
      synced: 0,
      createdAt: Date.now(),
    })
  }

  async function handleHoleDelete(holeId) {
    const targetHole = holes.find(h => h.holeId === holeId)
    setHoles(prev => prev.filter(h => h.holeId !== holeId))

    try {
      await deleteRecord(holeId)
      if (targetHole?.synced && window.navigator.onLine && firebaseReady) {
        await deleteHole(holeId)
      }
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  async function handleReset() {
    if (holes.length && !window.confirm('¿Resetear turno? Los datos ya están guardados localmente y en Firebase cuando hay conexión.')) return
    setShift(null)
    setHoles([])
    setHeaderKey(prev => prev + 1)

    try {
      await clearOperatorSnapshot()
      await clearAllRecords()
    } catch (error) {
      console.error('Reset cleanup failed:', error)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-base)', paddingBottom: '5rem' }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'color-mix(in srgb, var(--color-surface-1) 95%, transparent)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-border-subtle)',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--color-text-muted)' }}>
            FOR-PO-04
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-border-strong)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--color-brand-amber)' }}>
            Perforación
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5625rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: !isOnline ? 'var(--color-brand-amber)' : firebaseReady ? 'var(--color-brand-emerald)' : 'var(--color-text-faint)',
          }}>
            {!isOnline ? '○ Offline listo' : firebaseReady ? '● Online' : '○ Offline'}
          </span>

          {shift && (
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-text-muted)',
                transition: 'color 0.15s',
                padding: '0.25rem',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              Reset
            </button>
          )}
        </div>
      </header>

      <div style={{ paddingTop: '1rem' }}>
        <ShiftHeader key={headerKey} onFrozen={handleShiftFrozen} initialShift={shift} />

        {shift && (
          <>
            <HoleEntry
              nextHoleNumber={nextHoleNumber}
              onSaved={handleHoleSaved}
            />
            <HoleLog
              holes={holes}
              totalMeters={totalMeters}
              onDelete={handleHoleDelete}
              shiftLocation={shift.location}
              onForceSync={() => syncPendingRecords(true)}
              syncDisabled={pendingSyncCount === 0 || !isOnline || !firebaseReady}
              syncing={syncing}
            />
          </>
        )}
      </div>

      <Toast state={toastState} />
    </div>
  )
}
