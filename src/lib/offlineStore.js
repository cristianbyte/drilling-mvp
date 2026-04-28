import { openDB } from 'idb'

const DB_NAME = 'drilling-offline'
const DB_VERSION = 2
const APP_STATE_STORE = 'appState'
const RECORDS_STORE = 'records'
const OPERATOR_KEY = 'operator-form'
const SYNC_PENDING = 0
const SYNC_DONE = 1

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

export async function saveOperatorSnapshot(snapshot) {
  const db = await dbPromise
  await db.put(APP_STATE_STORE, snapshot, OPERATOR_KEY)
  return snapshot
}

export async function clearOperatorSnapshot() {
  const db = await dbPromise
  await db.delete(APP_STATE_STORE, OPERATOR_KEY)
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

export async function clearAllRecords() {
  const db = await dbPromise
  await db.clear(RECORDS_STORE)
}

export async function getPendingRecords() {
  const db = await dbPromise
  const records = (await db.getAll(RECORDS_STORE))
    .map(normalizeRecord)
    .filter(record => record.synced !== SYNC_DONE)

  return records.sort((a, b) => {
    if (a.kind === b.kind) return (a.createdAt || 0) - (b.createdAt || 0)
    return a.kind === 'shift' ? -1 : 1
  })
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
