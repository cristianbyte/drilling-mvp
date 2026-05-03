import { openDB } from 'idb'

const DB_NAME = 'drilling-offline'
const DB_VERSION = 2
const APP_STATE_STORE = 'appState'
const RECORDS_STORE = 'records'
const OPERATOR_KEY = 'operator-form'
const CARGA_KEY = 'carga-form'
const SYNC_PENDING = 0
const SYNC_DONE = 1
const VIEW_RESET_CONFIG = {
  perforacion: {
    snapshotKey: OPERATOR_KEY,
    kinds: ['shift', 'hole'],
  },
  carga: {
    snapshotKey: CARGA_KEY,
    kinds: ['carga-context', 'carga-hole'],
  },
}
const KIND_ORDER = {
  shift: 0,
  'carga-context': 0,
  hole: 1,
  'carga-hole': 1,
}

function isSyncedValue(value) {
  return value === true || value === SYNC_DONE || value === 'synced'
}

function normalizeRecord(record) {
  if (!record) return record

  const synced = isSyncedValue(record.synced) ? SYNC_DONE : SYNC_PENDING

  return {
    ...record,
    synced,
    syncStatus: synced === SYNC_DONE ? 'synced' : 'pending',
    syncedAt: synced === SYNC_DONE ? record.syncedAt ?? null : null,
    lastSyncAttemptAt: record.lastSyncAttemptAt ?? null,
    syncError: record.syncError ?? null,
  }
}

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(APP_STATE_STORE)) {
      db.createObjectStore(APP_STATE_STORE)
    }

    if (!db.objectStoreNames.contains(RECORDS_STORE)) {
      const records = db.createObjectStore(RECORDS_STORE, { keyPath: 'id' })
      records.createIndex('by-synced', 'synced')
      records.createIndex('by-kind', 'kind')
      records.createIndex('by-createdAt', 'createdAt')
    }
  },
})

export async function loadOperatorSnapshot() {
  const db = await dbPromise
  return (await db.get(APP_STATE_STORE, OPERATOR_KEY)) || null
}

export async function loadCargaSnapshot() {
  const db = await dbPromise
  return (await db.get(APP_STATE_STORE, CARGA_KEY)) || null
}

export async function saveOperatorSnapshot(snapshot) {
  const db = await dbPromise
  await db.put(APP_STATE_STORE, snapshot, OPERATOR_KEY)
  return snapshot
}

export async function saveCargaSnapshot(snapshot) {
  const db = await dbPromise
  await db.put(APP_STATE_STORE, snapshot, CARGA_KEY)
  return snapshot
}

export async function clearOperatorSnapshot() {
  const db = await dbPromise
  await db.delete(APP_STATE_STORE, OPERATOR_KEY)
}

export async function clearCargaSnapshot() {
  const db = await dbPromise
  await db.delete(APP_STATE_STORE, CARGA_KEY)
}

export async function saveRecord(record) {
  const db = await dbPromise
  const next = normalizeRecord(record)
  await db.put(RECORDS_STORE, next)
  return next
}

export async function deleteRecord(id) {
  const db = await dbPromise
  await db.delete(RECORDS_STORE, id)
}

export async function clearLocalViewState(view) {
  const config = VIEW_RESET_CONFIG[view]

  if (!config) {
    throw new Error(`Unknown local view state: ${view}`)
  }

  const db = await dbPromise
  const tx = db.transaction([APP_STATE_STORE, RECORDS_STORE], 'readwrite')

  await tx.objectStore(APP_STATE_STORE).delete(config.snapshotKey)

  const recordsStore = tx.objectStore(RECORDS_STORE)
  const records = await recordsStore.getAll()
  const allowedKinds = new Set(config.kinds)

  await Promise.all(
    records
      .filter(record => allowedKinds.has(record.kind))
      .map(record => recordsStore.delete(record.id)),
  )

  await tx.done
}

export async function getPendingRecords() {
  const db = await dbPromise
  const records = (await db.getAll(RECORDS_STORE))
    .map(normalizeRecord)
    .filter(record => record.synced !== SYNC_DONE)

  return records.sort((a, b) => {
    const orderA = KIND_ORDER[a.kind] ?? 99
    const orderB = KIND_ORDER[b.kind] ?? 99

    if (orderA !== orderB) return orderA - orderB
    if (a.kind === b.kind) return (a.createdAt || 0) - (b.createdAt || 0)
    return a.kind.localeCompare(b.kind)
  })
}

export async function getPendingRecordsByKinds(kinds) {
  const pending = await getPendingRecords()
  const allowedKinds = new Set(kinds)
  return pending.filter(record => allowedKinds.has(record.kind))
}

export async function markRecordSynced(id) {
  const db = await dbPromise
  const record = await db.get(RECORDS_STORE, id)
  if (!record) return null

  const next = normalizeRecord({
    ...record,
    synced: SYNC_DONE,
    syncedAt: Date.now(),
    lastSyncAttemptAt: Date.now(),
    syncError: null,
  })

  await db.put(RECORDS_STORE, next)
  return next
}

export async function markRecordPending(id, syncError = null) {
  const db = await dbPromise
  const record = await db.get(RECORDS_STORE, id)
  if (!record) return null

  const next = normalizeRecord({
    ...record,
    synced: SYNC_PENDING,
    syncedAt: null,
    lastSyncAttemptAt: Date.now(),
    syncError,
  })

  await db.put(RECORDS_STORE, next)
  return next
}
