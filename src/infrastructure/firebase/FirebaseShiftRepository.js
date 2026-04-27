import { equalTo, get, onValue, orderByChild, push, query, ref, serverTimestamp, set } from 'firebase/database'
import { db, ready } from './firebaseClient'
import { mergeMaps } from '../../lib/utils'

export class FirebaseShiftRepository {
  async createShift(data) {
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

  async upsertShift(shiftId, data) {
    if (!ready) return null
    await set(ref(db, `shifts/${shiftId}`), {
      ...data,
      createdAt: serverTimestamp(),
      frozenAt: serverTimestamp(),
    })
    return shiftId
  }

  async shiftExists(shiftId) {
    if (!ready) return false
    const snap = await get(ref(db, `shifts/${shiftId}`))
    return snap.exists()
  }

  async fetchShiftsByDate(date) {
    if (!ready || !date) return {}
    const shiftsQuery = query(ref(db, 'shifts'), orderByChild('date'), equalTo(date))
    const snap = await get(shiftsQuery)
    return snap.val() || {}
  }

  async fetchShiftsByIds(shiftIds) {
    if (!ready || !shiftIds.length) return {}

    const shiftMaps = await Promise.all(
      shiftIds.map(async shiftId => {
        const snap = await get(ref(db, `shifts/${shiftId}`))
        return snap.exists() ? { [shiftId]: snap.val() } : {}
      })
    )

    return mergeMaps(shiftMaps)
  }

  subscribeShiftsByDate(date, callback) {
    if (!ready || !date) {
      callback({})
      return () => {}
    }

    const shiftsQuery = query(ref(db, 'shifts'), orderByChild('date'), equalTo(date))
    return onValue(shiftsQuery, snap => {
      callback(snap.val() || {})
    })
  }
}
