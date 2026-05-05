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
      | "sample_1"
      | "sample_2"
      | "sample_3"
      | "sample_4"
      | "final_weight"
    >,
  ): Promise<string | null>;
  findOrCreateBlast(
    data: Omit<
      Blast,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "updatedBy"
      | "isComplete"
      | "completedAt"
      | "densityComplete"
      | "sample_1"
      | "sample_2"
      | "sample_3"
      | "sample_4"
      | "final_weight"
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
      "sample_1" | "sample_2" | "sample_3" | "sample_4" | "final_weight"
    >,
    updatedBy: string,
  ): Promise<void>;
  subscribeBlastsByDate(date: string, cb: (data: Blast[]) => void): () => void;
}
