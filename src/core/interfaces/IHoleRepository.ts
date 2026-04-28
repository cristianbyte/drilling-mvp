import { HoleFull, HoleDrilling, HoleLoading } from "../entities/Hole";

export interface IHoleRepository {
  createHole(
    blastId: string,
    shiftId: string,
    holeNumber: number,
  ): Promise<string | null>;
  fetchHolesByBlast(blastId: string): Promise<HoleFull[]>;
  updateDrilling(
    holeId: string,
    data: Partial<HoleDrilling>,
    updatedBy: string,
  ): Promise<void>;
  updateLoading(holeId: string, data: Partial<HoleLoading>): Promise<void>;
  subscribeHolesByBlast(
    blastId: string,
    callback: (data: HoleFull[]) => void,
  ): () => void;
  deleteHole(holeId: string): Promise<void>;
}
