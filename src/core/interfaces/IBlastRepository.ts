import { Blast, SiteEnum } from "../entities/Blast";

export interface IBlastRepository {
  createBlast(
    data: Omit<Blast, "id" | "createdAt" | "completedAt" | "isComplete">,
  ): Promise<string | null>;
  fetchBlastsByDate(date: string): Promise<Blast[]>;
  fetchBlastById(blastId: string): Promise<Blast | null>;
  fetchBlastsByLocation(location: SiteEnum): Promise<Blast[]>;
  fetchIncompleteBlasts(): Promise<Blast[]>;
  subscribeBlastsByDate(
    date: string,
    callback: (data: Blast[]) => void,
  ): () => void;
}
