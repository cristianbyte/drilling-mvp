/**
 * @typedef {Object} IShiftRepository
 * @property {(data: Object) => Promise<string|null>} createShift
 * @property {(shiftId: string, data: Object) => Promise<string|null>} upsertShift
 * @property {(shiftId: string) => Promise<boolean>} shiftExists
 * @property {(date: string) => Promise<Object>} fetchShiftsByDate
 * @property {(shiftIds: string[]) => Promise<Object>} fetchShiftsByIds
 * @property {(date: string, callback: (data: Object) => void) => Function} subscribeShiftsByDate
 */

export const IShiftRepository = {}
