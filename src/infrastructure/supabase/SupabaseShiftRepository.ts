import { supabase } from "./supabaseClient";
import { Shift } from "../../core/entities/Shift";
import { IShiftRepository } from "../../core/interfaces/IShiftRepository";

export class SupabaseShiftRepository implements IShiftRepository {
  private mapFromDb(row: any): Shift {
    return {
      id: row.id,
      blastId: row.blast_id,
      operatorName: row.operator_name,
      equipment: row.equipment,
      shiftType: row.shift_type,
      date: row.date,
      diameter: row.diameter,
      elevation: row.elevation,
      pattern: row.pattern,
      createdAt: row.created_at,
    };
  }

  private mapToDb(data: any): any {
    return {
      blast_id: data.blastId,
      operator_name: data.operatorName,
      equipment: data.equipment,
      shift_type: data.shiftType,
      date: data.date,
      diameter: data.diameter,
      elevation: data.elevation,
      pattern: data.pattern,
    };
  }

  async createShift(
    data: Omit<Shift, "id" | "createdAt">,
  ): Promise<string | null> {
    const { data: result, error } = await supabase
      .from("shifts")
      .insert([this.mapToDb(data)])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating shift:", error);
      return null;
    }

    return result?.id ?? null;
  }

  async fetchShiftsByBlast(blastId: string): Promise<Shift[]> {
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("blast_id", blastId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching shifts by blast:", error);
      return [];
    }

    return (data ?? []).map((row) => this.mapFromDb(row));
  }

  async fetchShiftsByDate(date: string): Promise<Shift[]> {
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("date", date)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching shifts by date:", error);
      return [];
    }

    return (data ?? []).map((row) => this.mapFromDb(row));
  }

  // Bridge methods for offline sync compatibility
  async upsertShift(shiftId: string, data: any): Promise<string | null> {
    const { error } = await supabase.from("shifts").upsert({
      id: shiftId,
      ...this.mapToDb(data),
    });

    if (error) {
      console.error("Error upserting shift:", error);
      return null;
    }

    return shiftId;
  }

  async shiftExists(shiftId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("shifts")
      .select("id")
      .eq("id", shiftId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking shift existence:", error);
    }

    return !!data;
  }

  // Bridge method for SupervisorDashboard
  async fetchShiftsByIds(shiftIds: string[]): Promise<Record<string, any>> {
    if (!shiftIds.length) return {};

    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .in("id", shiftIds);

    if (error) {
      console.error("Error fetching shifts by ids:", error);
      return {};
    }

    const result: Record<string, any> = {};
    (data ?? []).forEach((row) => {
      result[row.id] = this.mapFromDb(row);
    });

    return result;
  }
}
