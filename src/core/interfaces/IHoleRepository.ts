import { HoleFull, HoleDrilling, HoleLoading } from "../entities/entities";

export interface IHoleRepository {
  createHole(blastId: string, holeNumber: number): Promise<string | null>;
  upsertHoles(
    blastId: string,
    holeNumbers: number[],
  ): Promise<Array<{ id: string; holeNumber: number }>>;
  fetchHolesByBlast(blastId: string): Promise<HoleFull[]>;
  deleteDrilling(holeId: string): Promise<void>;
  upsertDrilling(
    holeId: string,
    data: { operatorId: string } & Partial<Pick<HoleDrilling, "depth" | "ceiling" | "floor">>,
    updatedBy: string,
  ): Promise<void>;
  upsertLoading(
    holeId: string,
    data: { leaderId?: string | null } & Partial<
      Omit<
        HoleLoading,
        "id" | "holeId" | "leaderId" | "createdAt" | "updatedAt" | "updatedBy"
      >
    >,
    updatedBy: string,
  ): Promise<void>;
  upsertLoadingPlan(
    rows: Array<
      {
        holeId: string;
      } & Partial<
        Omit<
          HoleLoading,
          "id" | "holeId" | "leaderId" | "createdAt" | "updatedAt" | "updatedBy"
        >
      >
    >,
    updatedBy: string,
  ): Promise<void>;
}
