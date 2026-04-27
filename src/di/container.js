import { FirebaseShiftRepository } from '../infrastructure/firebase/FirebaseShiftRepository'
import { FirebaseHoleRepository } from '../infrastructure/firebase/FirebaseHoleRepository'

export const shiftRepository = new FirebaseShiftRepository()
export const holeRepository = new FirebaseHoleRepository()
