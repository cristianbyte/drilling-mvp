export type WorkShift = "DIA" | "NOCHE";

export interface Shift {
  id: string;
  blastId: string;
  operatorName: string;
  equipment: string | null;
  shiftType: WorkShift;
  date: string;
  diameter: number;
  elevation: number;
  pattern: string;
  createdAt: string;
}
