import { clearOperatorSnapshot, loadOperatorSnapshot, saveOperatorSnapshot } from '../../lib/offlineStore'

export class OfflineShiftRepository {
  loadSnapshot() {
    return loadOperatorSnapshot()
  }

  saveSnapshot(snapshot) {
    return saveOperatorSnapshot(snapshot)
  }

  clearSnapshot() {
    return clearOperatorSnapshot()
  }
}
