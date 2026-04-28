import { supabase } from "./supabaseClient";
import { PlannedHole } from "../../core/entities/Hole";
import { IPlannedHoleRepository } from "../../core/interfaces/IPlannedHoleRepository";

export class SupabasePlannedHoleRepository implements IPlannedHoleRepository {
  private mapFromDb(row: any): PlannedHole {
    return {
      id: row.id,
      blastId: row.blast_id,
      holeNumber: row.hole_number,
      plannedDepth: row.planned_depth,
      plannedEmulsion: row.planned_emulsion,
      plannedStemmingInitial: row.planned_stemming_initial,
      plannedStemmingFinal: row.planned_stemming_final,
    };
  }

  private mapToDb(data: Omit<PlannedHole, "id">): any {
    return {
      blast_id: data.blastId,
      hole_number: data.holeNumber,
      planned_depth: data.plannedDepth,
      planned_emulsion: data.plannedEmulsion,
      planned_stemming_initial: data.plannedStemmingInitial,
      planned_stemming_final: data.plannedStemmingFinal,
    };
  }

  async upsertPlannedHoles(
    _blastId: string,
    rows: Omit<PlannedHole, "id">[],
  ): Promise<void> {
    const mapped = rows.map((row) => this.mapToDb(row));

    const { error } = await supabase
      .from("planned_holes")
      .upsert(mapped, { onConflict: "blast_id,hole_number" });

    if (error) {
      console.error("Error upserting planned holes:", error);
    }
  }

  async fetchPlannedHoles(blastId: string): Promise<PlannedHole[]> {
    const { data, error } = await supabase
      .from("planned_holes")
      .select("*")
      .eq("blast_id", blastId)
      .order("hole_number", { ascending: true });

    if (error) {
      console.error("Error fetching planned holes:", error);
      return [];
    }

    return (data ?? []).map((row) => this.mapFromDb(row));
  }
}
