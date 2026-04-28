import { SupabaseBlastRepository } from '../infrastructure/supabase/SupabaseBlastRepository'
import { SupabaseShiftRepository } from '../infrastructure/supabase/SupabaseShiftRepository'
import { SupabaseHoleRepository } from '../infrastructure/supabase/SupabaseHoleRepository'
import { SupabasePlannedHoleRepository } from '../infrastructure/supabase/SupabasePlannedHoleRepository'
import { SupabaseDensityControlRepository } from '../infrastructure/supabase/SupabaseDensityControlRepository'

export const blastRepository = new SupabaseBlastRepository()
export const shiftRepository = new SupabaseShiftRepository()
export const holeRepository = new SupabaseHoleRepository()
export const plannedHoleRepository = new SupabasePlannedHoleRepository()
export const densityControlRepository = new SupabaseDensityControlRepository()
