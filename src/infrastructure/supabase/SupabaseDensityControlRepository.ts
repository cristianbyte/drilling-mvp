import { supabase } from "./supabaseClient";
import { DensityControl } from "../../core/entities/Hole";
import { IDensityControlRepository } from "../../core/interfaces/IDensityControlRepository";

export class SupabaseDensityControlRepository implements IDensityControlRepository {
  private mapFromDb(row: any): DensityControl {
    return {
      id: row.id,
      blastId: row.blast_id,
      sample1: row.sample1,
      sample2: row.sample2,
      sample3: row.sample3,
      sample4: row.sample4,
      finalWeight: row.final_weight,
      isComplete: row.is_complete,
      filledAt: row.filled_at,
    };
  }

  private mapToDb(data: Partial<DensityControl>): any {
    const mapped: any = {};
    if (data.sample1 !== undefined) mapped.sample1 = data.sample1;
    if (data.sample2 !== undefined) mapped.sample2 = data.sample2;
    if (data.sample3 !== undefined) mapped.sample3 = data.sample3;
    if (data.sample4 !== undefined) mapped.sample4 = data.sample4;
    if (data.finalWeight !== undefined) mapped.final_weight = data.finalWeight;
    if (data.filledAt !== undefined) mapped.filled_at = data.filledAt;
    return mapped;
  }

  async upsertDensityControl(
    blastId: string,
    data: Partial<DensityControl>,
  ): Promise<void> {
    const mapped = this.mapToDb(data);
    mapped.blast_id = blastId;

    const { error } = await supabase
      .from("density_control")
      .upsert(mapped, { onConflict: "blast_id" });

    if (error) {
      console.error("Error upserting density control:", error);
    }
  }

  async fetchDensityControl(blastId: string): Promise<DensityControl | null> {
    const { data, error } = await supabase
      .from("density_control")
      .select("*")
      .eq("blast_id", blastId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        return null;
      }
      console.error("Error fetching density control:", error);
      return null;
    }

    return this.mapFromDb(data);
  }
}
