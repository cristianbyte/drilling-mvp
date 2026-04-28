import { Shift } from "../entities/Shift";

export interface IShiftRepository {
  createShift(data: Omit<Shift, "id" | "createdAt">): Promise<string | null>;
  fetchShiftsByBlast(blastId: string): Promise<Shift[]>;
  fetchShiftsByDate(date: string): Promise<Shift[]>;
}
