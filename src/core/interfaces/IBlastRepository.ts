import { Blast, BlastFull, Leader, SiteEnum } from "../entities/entities";

export interface IBlastRepository {
  createBlast(
    data: Omit<
      Blast,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "updatedBy"
      | "isComplete"
      | "completedAt"
      | "densityComplete"
      | "sample1"
      | "sample2"
      | "sample3"
      | "sample4"
      | "finalWeight"
    >,
  ): Promise<string | null>;
  fetchAllBlasts(): Promise<Blast[]>;
  fetchBlastById(id: string): Promise<Blast | null>;
  fetchCargaHeaderData(): Promise<{ leaders: Leader[]; blasts: Blast[] }>;
  fetchBlastsByDate(date: string): Promise<Blast[]>;
  fetchBlastsByLocation(location: SiteEnum): Promise<Blast[]>;
  fetchBlastFull(id: string): Promise<BlastFull | null>;
  fetchBlastFullLoading(id: string): Promise<BlastFull | null>;
  upsertDensity(
    blastId: string,
    patch: Pick<
      Blast,
      "sample1" | "sample2" | "sample3" | "sample4" | "finalWeight"
    >,
    updatedBy: string,
  ): Promise<void>;
  subscribeBlastsByDate(date: string, cb: (data: Blast[]) => void): () => void;
}
