/**
 * @typedef {Object} IHoleRepository
 * @property {(shiftId: string, data: Object) => Promise<string|null>} createHole
 * @property {(holeId: string, shiftId: string, data: Object) => Promise<string|null>} upsertHole
 * @property {(holeId: string) => Promise<boolean>} holeExists
 * @property {(shiftIds: string[]) => Promise<Object>} fetchHolesByShiftIds
 * @property {(shiftIds: string[], callback: (data: Object) => void) => Function} subscribeHolesByShiftIds
 * @property {(limit: number, callback: (data: Object) => void) => Function} subscribeRecentHoles
 * @property {(holeId: string, patch: Object, name: string) => Promise<void>} updateHole
 * @property {(holeId: string) => Promise<void>} deleteHole
 */

export const IHoleRepository = {}
