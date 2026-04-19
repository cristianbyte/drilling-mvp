const DB_NAME = 'drilling-offline'
const DB_VERSION = 1
const STORE_NAME = 'appState'
const OPERATOR_KEY = 'operator-form'

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB'))
  })
}

function withStore(mode, work) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)

    let settled = false
    function done(fn, value) {
      if (settled) return
      settled = true
      fn(value)
    }

    tx.oncomplete = () => {
      if (!settled) done(resolve)
      db.close()
    }
    tx.onerror = () => {
      done(reject, tx.error || new Error('Transacción de IndexedDB falló'))
      db.close()
    }
    tx.onabort = () => {
      done(reject, tx.error || new Error('Transacción de IndexedDB abortada'))
      db.close()
    }

    work(store, resolve, reject)
  }))
}

export function loadOperatorSnapshot() {
  return withStore('readonly', (store, resolve, reject) => {
    const request = store.get(OPERATOR_KEY)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error || new Error('No se pudo leer el snapshot'))
  })
}

export function saveOperatorSnapshot(snapshot) {
  return withStore('readwrite', (store, resolve, reject) => {
    const request = store.put(snapshot, OPERATOR_KEY)
    request.onsuccess = () => resolve(snapshot)
    request.onerror = () => reject(request.error || new Error('No se pudo guardar el snapshot'))
  })
}

export function clearOperatorSnapshot() {
  return withStore('readwrite', (store, resolve, reject) => {
    const request = store.delete(OPERATOR_KEY)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error || new Error('No se pudo limpiar el snapshot'))
  })
}
