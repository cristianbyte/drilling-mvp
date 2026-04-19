import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, update, push, serverTimestamp, get } from 'firebase/database'

// ─── Firebase config ────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCIdlI8mXu2UeujV3nx9MMI051kTjEirN8",
  authDomain: "drilling-app-d57d8.firebaseapp.com",
  databaseURL: "https://drilling-app-d57d8-default-rtdb.firebaseio.com",
  projectId: "drilling-app-d57d8",
  storageBucket: "drilling-app-d57d8.firebasestorage.app",
  messagingSenderId: "1013959235478",
  appId: "1:1013959235478:web:25c9e6768e7df215caafb7"
};

// ─── Firebase schema ─────────────────────────────────────────────────────────
//
//  shifts/                           ← generic / one per shift
//    {shiftId}:
//      operatorName  string
//      equipment     string
//      location      string   "HATILLO NORTE" | "HATILLO SUR"
//      date          string   "YYYY-MM-DD"
//      shift         string   "DIA" | "NOCHE"
//      blastId       string   # Voladura
//      diameter      number   mm
//      elevation     number   m
//      pattern       string   "3×3"
//      createdAt     timestamp
//      frozenAt      timestamp   (set when header is locked)
//
//  holes/                            ← repetitive / one per barreno
//    {holeId}:
//      shiftId       string   FK → shifts
//      holeNumber    number
//      depth         number   m
//      ceiling       number   m
//      floor         number   m
//      createdAt     timestamp
//      updatedAt     timestamp   (set on supervisor corrections)
//      updatedBy     string      (supervisor name on correction)
//
// ─────────────────────────────────────────────────────────────────────────────

let app, db, ready = false

try {
  app = initializeApp(firebaseConfig)
  db = getDatabase(app)
  ready = true
} catch (e) {
  console.warn('Firebase not configured — offline mode', e)
}

/** Create a shift record. Returns the generated shiftId. */
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

/** Append a hole record. Returns the generated holeId. */
export async function createHole(shiftId, data) {
  if (!ready) return null
  const holesRef = ref(db, 'holes')
  const newRef = push(holesRef)
  await set(newRef, {
    shiftId,
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

/** Supervisor correction: patch any hole by its ID. */
export async function updateHole(holeId, patch, supervisorName) {
  if (!ready) return
  const holeRef = ref(db, `holes/${holeId}`)
  await update(holeRef, {
    ...patch,
    updatedAt: serverTimestamp(),
    updatedBy: supervisorName,
  })
}

/** Delete a hole by ID (operator self-correction within same session). */
export async function deleteHole(holeId) {
  if (!ready) return
  const { remove } = await import('firebase/database')
  const holeRef = ref(db, `holes/${holeId}`)
  await remove(holeRef)
}
 
export { ready as firebaseReady }
