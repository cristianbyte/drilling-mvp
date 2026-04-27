import { equalTo, get, limitToLast, onValue, orderByChild, push, query, ref, serverTimestamp, set, update } from 'firebase/database'
import { db, ready } from './firebaseClient'
import { mergeMaps } from '../../lib/utils'

export class FirebaseHoleRepository {
  async createHole(shiftId, data) {
    if (!ready) return null
    const holesRef = ref(db, 'holes')
    const newRef = push(holesRef)
    await set(newRef, {
      shiftId,
      date: data.date ?? null,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: data.updatedAt ?? null,
      updatedBy: data.updatedBy ?? null,
    })
    return newRef.key
  }

  async upsertHole(holeId, shiftId, data) {
    if (!ready) return null
    await set(ref(db, `holes/${holeId}`), {
      shiftId,
      date: data.date ?? null,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: data.updatedAt ?? null,
      updatedBy: data.updatedBy ?? null,
    })
    return holeId
  }

  async holeExists(holeId) {
    if (!ready) return false
    const snap = await get(ref(db, `holes/${holeId}`))
    return snap.exists()
  }

  async fetchHolesByShiftIds(shiftIds) {
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

  subscribeHolesByShiftIds(shiftIds, callback) {
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

  subscribeRecentHoles(limit, callback) {
    if (!ready || !limit) {
      callback({})
      return () => {}
    }

    const recentHolesQuery = query(ref(db, 'holes'), orderByChild('createdAt'), limitToLast(limit))
    return onValue(recentHolesQuery, snap => {
      callback(snap.val() || {})
    })
  }

  async updateHole(holeId, patch, name) {
    if (!ready) return
    const holeRef = ref(db, `holes/${holeId}`)
    await update(holeRef, {
      ...patch,
      updatedAt: serverTimestamp(),
      updatedBy: name,
    })
  }

  async deleteHole(holeId) {
    if (!ready) return
    const { remove } = await import('firebase/database')
    const holeRef = ref(db, `holes/${holeId}`)
    await remove(holeRef)
  }
}
