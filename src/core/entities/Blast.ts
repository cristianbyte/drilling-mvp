export type SiteEnum = "HATILLO NORTE" | "HATILLO SUR";

export interface Blast {
  id: string;
  location: SiteEnum;
  blastCode: string;
  leader: string;
  date: string;
  isComplete: boolean;
  createdAt: string;
  completedAt: string | null;
}
