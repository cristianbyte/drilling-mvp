import { HoleFull, HoleDrilling, HoleLoading } from "../entities/entities";

export interface IHoleRepository {
  createHole(blastId: string, holeNumber: number): Promise<string | null>;
  fetchHolesByBlast(blastId: string): Promise<HoleFull[]>;
  upsertDrilling(
    holeId: string,
    data: { operatorId: string } & Partial<Pick<HoleDrilling, "depth" | "ceiling" | "floor">>,
    updatedBy: string,
  ): Promise<void>;
  upsertLoading(
    holeId: string,
    data: { leaderId: string } & Partial<
      Omit<
        HoleLoading,
        "id" | "holeId" | "leaderId" | "createdAt" | "updatedAt" | "updatedBy"
      >
    >,
    updatedBy: string,
  ): Promise<void>;
}
