import { initializeApp } from 'firebase/app'
import { equalTo, get, getDatabase, limitToLast, onValue, orderByChild, push, query, ref, serverTimestamp, set, update } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyCIdlI8mXu2UeujV3nx9MMI051kTjEirN8',
  authDomain: 'drilling-app-d57d8.firebaseapp.com',
  databaseURL: 'https://drilling-app-d57d8-default-rtdb.firebaseio.com',
  projectId: 'drilling-app-d57d8',
  storageBucket: 'drilling-app-d57d8.firebasestorage.app',
  messagingSenderId: '1013959235478',
  appId: '1:1013959235478:web:25c9e6768e7df215caafb7',
}

let app
let db
let ready = false

try {
  app = initializeApp(firebaseConfig)
  db = getDatabase(app)
  ready = true
} catch (error) {
  console.warn('Firebase not configured - offline mode', error)
}

function mergeMaps(maps = []) {
  return maps.reduce((acc, current) => {
    if (!current) return acc
    return { ...acc, ...current }
  }, {})
}

export async function createShift(data) {
  if (!ready) return null
  const shiftsRef = ref(db, 'shifts')
  const newRef = push(shiftsRef)
  await set(newRef, {
    ...data,
    createdAt: serverTimestamp(),
    frozenAt: serverTimestamp(),
  })
  return newRef.key
}

export async function upsertShift(shiftId, data) {
  if (!ready) return null
  await set(ref(db, `shifts/${shiftId}`), {
    ...data,
    createdAt: serverTimestamp(),
    frozenAt: serverTimestamp(),
  })
  return shiftId
}

export async function shiftExists(shiftId) {
  if (!ready) return false
  const snap = await get(ref(db, `shifts/${shiftId}`))
  return snap.exists()
}

export async function createHole(shiftId, data) {
  if (!ready) return null
  const holesRef = ref(db, 'holes')
  const newRef = push(holesRef)
  await set(newRef, {
    shiftId,
    date: data.date ?? null,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: null,
    updatedBy: null,
  })
  return newRef.key
}

export async function upsertHole(holeId, shiftId, data) {
  if (!ready) return null
  await set(ref(db, `holes/${holeId}`), {
    shiftId,
    date: data.date ?? null,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: null,
    updatedBy: null,
  })
  return holeId
}

export async function holeExists(holeId) {
  if (!ready) return false
  const snap = await get(ref(db, `holes/${holeId}`))
  return snap.exists()
}

export function subscribeShiftsByDate(date, callback) {
  if (!ready || !date) {
    callback({})
    return () => {}
  }

  const shiftsQuery = query(ref(db, 'shifts'), orderByChild('date'), equalTo(date))
  return onValue(shiftsQuery, snap => {
    callback(snap.val() || {})
  })
}

export function subscribeHolesByShiftIds(shiftIds, callback) {
  if (!ready || !shiftIds.length) {
    callback({})
    return () => {}
  }

  const holeMaps = {}
  const unsubs = shiftIds.map(shiftId => {
    const holesQuery = query(ref(db, 'holes'), orderByChild('shiftId'), equalTo(shiftId))
    return onValue(holesQuery, snap => {
      holeMaps[shiftId] = snap.val() || {}
      callback(mergeMaps(Object.values(holeMaps)))
    })
  })

  return () => {
    unsubs.forEach(unsub => unsub())
  }
}

export async function fetchShiftsByDate(date) {
  if (!ready || !date) return {}
  const shiftsQuery = query(ref(db, 'shifts'), orderByChild('date'), equalTo(date))
  const snap = await get(shiftsQuery)
  return snap.val() || {}
}

export async function fetchHolesByShiftIds(shiftIds) {
  if (!ready || !shiftIds.length) return {}

  const holeMaps = await Promise.all(
    shiftIds.map(async shiftId => {
      const holesQuery = query(ref(db, 'holes'), orderByChild('shiftId'), equalTo(shiftId))
      const snap = await get(holesQuery)
      return snap.val() || {}
    })
  )

  return mergeMaps(holeMaps)
}

export async function fetchShiftsByIds(shiftIds) {
  if (!ready || !shiftIds.length) return {}

  const shiftMaps = await Promise.all(
    shiftIds.map(async shiftId => {
      const snap = await get(ref(db, `shifts/${shiftId}`))
      return snap.exists() ? { [shiftId]: snap.val() } : {}
    })
  )

  return mergeMaps(shiftMaps)
}

export function subscribeRecentHoles(limit, callback) {
  if (!ready || !limit) {
    callback({})
    return () => {}
  }

  const recentHolesQuery = query(ref(db, 'holes'), orderByChild('createdAt'), limitToLast(limit))
  return onValue(recentHolesQuery, snap => {
    callback(snap.val() || {})
  })
}

export async function updateHole(holeId, patch, supervisorName) {
  if (!ready) return
  const holeRef = ref(db, `holes/${holeId}`)
  await update(holeRef, {
    ...patch,
    updatedAt: serverTimestamp(),
    updatedBy: supervisorName,
  })
}

export async function deleteHole(holeId) {
  if (!ready) return
  const { remove } = await import('firebase/database')
  const holeRef = ref(db, `holes/${holeId}`)
  await remove(holeRef)
}

export { ready as firebaseReady }
