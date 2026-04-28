import { DensityControl } from "../entities/Hole";

export interface IDensityControlRepository {
  upsertDensityControl(
    blastId: string,
    data: Partial<DensityControl>,
  ): Promise<void>;
  fetchDensityControl(blastId: string): Promise<DensityControl | null>;
}
