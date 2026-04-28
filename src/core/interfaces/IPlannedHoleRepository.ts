import { PlannedHole } from "../entities/Hole";

export interface IPlannedHoleRepository {
  upsertPlannedHoles(
    blastId: string,
    rows: Omit<PlannedHole, "id">[],
  ): Promise<void>;
  fetchPlannedHoles(blastId: string): Promise<PlannedHole[]>;
}
