import { Blast, BlastFull } from "../entities/entities";

export interface SupervisorDrillingRow {
  drillingId: string | null;
  depth: number | null;
  ceiling: number | null;
  floor: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  holeId: string | null;
  holeNumber: number | null;
  blastId: string | null;
  plannedDepth: number | null;
  operatorId: string | null;
  operatorName: string | null;
  equipment: string | null;
  shift: string | null;
  pattern: string | null;
  diameter: number | null;
  elevation: number | null;
  recency: string | null;
  date: string | null;
}

export interface SupervisorLoadingSnapshot {
  blasts: Blast[];
  blastFullById: Record<string, BlastFull>;
}

export interface ISupervisorRepository {
  fetchLatestDrillingRows(limit?: number): Promise<SupervisorDrillingRow[]>;
  fetchDrillingRowsByDate(
    date: string,
    timeZone?: string,
  ): Promise<SupervisorDrillingRow[]>;
  subscribeDrillingRows(
    options: { limit?: number; date?: string },
    cb: (data: SupervisorDrillingRow[]) => void,
  ): () => void;
  fetchLoadingSnapshot(): Promise<SupervisorLoadingSnapshot>;
  subscribeLoadingSnapshot(
    cb: (data: SupervisorLoadingSnapshot) => void,
  ): () => void;
}
