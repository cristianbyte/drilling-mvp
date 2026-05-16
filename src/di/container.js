import { SupabaseAccessoryUsageRepository } from "../infrastructure/supabase/SupabaseAccessoryUsageRepository";
import { SupabaseBlastRepository } from "../infrastructure/supabase/SupabaseBlastRepository";
import { SupabaseHoleRepository } from "../infrastructure/supabase/SupabaseHoleRepository";
import { SupabaseOperatorRepository } from "../infrastructure/supabase/SupabaseOperatorRepository";
import { SupabaseLeaderRepository } from "../infrastructure/supabase/SupabaseLeaderRepository";
import { SupabaseSupervisorRepository } from "../infrastructure/supabase/SupabaseSupervisorRepository";

export const accessoryUsageRepository = new SupabaseAccessoryUsageRepository();
export const blastRepository = new SupabaseBlastRepository();
export const holeRepository = new SupabaseHoleRepository();
export const operatorRepository = new SupabaseOperatorRepository();
export const leaderRepository = new SupabaseLeaderRepository();
export const supervisorRepository = new SupabaseSupervisorRepository();
