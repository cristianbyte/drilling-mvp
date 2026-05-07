import { supabase } from "./supabaseClient";
import {
  HoleDrilling,
  HoleFull,
  HoleLoading,
  Leader,
  Operator,
} from "../../core/entities/entities";
import { IHoleRepository } from "../../core/interfaces/IHoleRepository";
import { toThreeDecimals } from "./numberFormat";
import { SubscriptionManager } from "./SubscriptionManager";

type DbOperatorRow = {
  id: string;
  name: string;
  shift_type: Operator["shiftType"];
  equipment: string;
  date: string;
  elevation: number | null;
  pattern: string | null;
  diameter: number | null;
  created_at: string;
};

type DbLeaderRow = {
  id: string;
  name: string;
  created_at: string;
};

type DbHoleDrillingRow = {
  id: string;
  hole_id: string;
  operator_id: string;
  depth: number | null;
  ceiling: number | null;
  floor: number | null;
  created_at: string;
  updated_at: string | null;
  updated_by: string | null;
  operators: DbOperatorRow | DbOperatorRow[] | null;
};

type DbHoleLoadingRow = {
  id: string;
  hole_id: string;
  leader_id: string | null;
  planned_depth: number | null;
  planned_emulsion: number | null;
  planned_stemming_initial: number | null;
  planned_stemming_final: number | null;
  leveling: number | null;
  deck: number | null;
  emulsion_total: number | null;
  stemming_final: number | null;
  created_at: string;
  updated_at: string | null;
  updated_by: string | null;
  leaders: DbLeaderRow | DbLeaderRow[] | null;
};

type DbHoleRow = {
  id: string;
  blast_id: string;
  hole_number: number;
  created_at: string;
  hole_drilling: DbHoleDrillingRow | DbHoleDrillingRow[] | null;
  hole_loading: DbHoleLoadingRow | DbHoleLoadingRow[] | null;
};

export class SupabaseHoleRepository implements IHoleRepository {
  private subscriptionMgr: SubscriptionManager;

  constructor(
    subscriptionMgr: SubscriptionManager = new SubscriptionManager(),
  ) {
    this.subscriptionMgr = subscriptionMgr;
  }

  private getRelationOne<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    return value ?? null;
  }

  private mapOperatorFromDb(row: DbOperatorRow): Operator {
    return {
      id: row.id,
      name: row.name,
      shiftType: row.shift_type,
      equipment: row.equipment,
      date: row.date,
      elevation: toThreeDecimals(row.elevation),
      pattern: row.pattern,
      diameter: toThreeDecimals(row.diameter),
      createdAt: row.created_at,
    };
  }

  private mapLeaderFromDb(row: DbLeaderRow): Leader {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  private mapHoleFromDb(row: DbHoleRow): HoleFull {
    const drillingRow = this.getRelationOne(row.hole_drilling);
    const loadingRow = this.getRelationOne(row.hole_loading);
    const operatorRow = this.getRelationOne(drillingRow?.operators);
    const leaderRow = this.getRelationOne(loadingRow?.leaders);

    return {
      id: row.id,
      blastId: row.blast_id,
      holeNumber: row.hole_number,
      createdAt: row.created_at,
      drilling:
        drillingRow && operatorRow
          ? {
              id: drillingRow.id,
              holeId: drillingRow.hole_id,
              operatorId: drillingRow.operator_id,
              depth: toThreeDecimals(drillingRow.depth),
              ceiling: toThreeDecimals(drillingRow.ceiling),
              floor: toThreeDecimals(drillingRow.floor),
              createdAt: drillingRow.created_at,
              updatedAt: drillingRow.updated_at,
              updatedBy: drillingRow.updated_by,
              operator: this.mapOperatorFromDb(operatorRow),
            }
          : null,
      loading:
        loadingRow && leaderRow
          ? {
              id: loadingRow.id,
              holeId: loadingRow.hole_id,
              leaderId: loadingRow.leader_id,
              plannedDepth: toThreeDecimals(loadingRow.planned_depth),
              plannedEmulsion: toThreeDecimals(loadingRow.planned_emulsion),
              plannedStemmingInitial: toThreeDecimals(
                loadingRow.planned_stemming_initial,
              ),
              plannedStemmingFinal: toThreeDecimals(
                loadingRow.planned_stemming_final,
              ),
              leveling: toThreeDecimals(loadingRow.leveling),
              deck: toThreeDecimals(loadingRow.deck),
              emulsionTotal: toThreeDecimals(loadingRow.emulsion_total),
              stemmingFinal: toThreeDecimals(loadingRow.stemming_final),
              createdAt: loadingRow.created_at,
              updatedAt: loadingRow.updated_at,
              updatedBy: loadingRow.updated_by,
              leader: this.mapLeaderFromDb(leaderRow),
            }
          : null,
    };
  }

  private mapDrillingToDb(
    data: { operatorId: string } & Partial<
      Pick<HoleDrilling, "depth" | "ceiling" | "floor">
    >,
    updatedBy: string,
  ) {
    const mapped: Record<string, unknown> = {
      operator_id: data.operatorId,
      updated_by: updatedBy,
    };

    if (data.depth !== undefined) {
      mapped.depth = toThreeDecimals(data.depth);
    }
    if (data.ceiling !== undefined) {
      mapped.ceiling = toThreeDecimals(data.ceiling);
    }
    if (data.floor !== undefined) {
      mapped.floor = toThreeDecimals(data.floor);
    }

    return mapped;
  }

  private mapLoadingToDb(
    data: { leaderId?: string | null } & Partial<
      Omit<
        HoleLoading,
        "id" | "holeId" | "leaderId" | "createdAt" | "updatedAt" | "updatedBy"
      >
    >,
    updatedBy: string,
  ) {
    const mapped: Record<string, unknown> = {
      updated_by: updatedBy,
    };

    if (data.leaderId !== undefined) {
      mapped.leader_id = data.leaderId;
    }

    if (data.plannedDepth !== undefined) {
      mapped.planned_depth = toThreeDecimals(data.plannedDepth);
    }
    if (data.plannedEmulsion !== undefined) {
      mapped.planned_emulsion = toThreeDecimals(data.plannedEmulsion);
    }
    if (data.plannedStemmingInitial !== undefined) {
      mapped.planned_stemming_initial = toThreeDecimals(
        data.plannedStemmingInitial,
      );
    }
    if (data.plannedStemmingFinal !== undefined) {
      mapped.planned_stemming_final = toThreeDecimals(data.plannedStemmingFinal);
    }
    if (data.leveling !== undefined) {
      mapped.leveling = toThreeDecimals(data.leveling);
    }
    if (data.deck !== undefined) {
      mapped.deck = toThreeDecimals(data.deck);
    }
    if (data.emulsionTotal !== undefined) {
      mapped.emulsion_total = toThreeDecimals(data.emulsionTotal);
    }
    if (data.stemmingFinal !== undefined) {
      mapped.stemming_final = toThreeDecimals(data.stemmingFinal);
    }

    return mapped;
  }

  async createHole(
    blastId: string,
    holeNumber: number,
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from("holes")
      .insert([
        {
          blast_id: blastId,
          hole_number: holeNumber,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating hole:", error);
      return null;
    }

    return data?.id ?? null;
  }

  async fetchHolesByBlast(blastId: string): Promise<HoleFull[]> {
    const { data, error } = await supabase
      .from("holes")
      .select(
        `
        *,
        hole_drilling (
          *,
          operators ( * )
        ),
        hole_loading (
          *,
          leaders ( * )
        )
      `,
      )
      .eq("blast_id", blastId)
      .order("hole_number");

    if (error) {
      console.error("Error fetching holes by blast:", error);
      return [];
    }

    return (data ?? []).map((row) => this.mapHoleFromDb(row as DbHoleRow));
  }

  async upsertHoles(
    blastId: string,
    holeNumbers: number[],
  ): Promise<Array<{ id: string; holeNumber: number }>> {
    const uniqueHoleNumbers = [...new Set(holeNumbers)];
    const { data, error } = await supabase
      .from("holes")
      .upsert(
        uniqueHoleNumbers.map((holeNumber) => ({
          blast_id: blastId,
          hole_number: holeNumber,
        })),
        { onConflict: "blast_id,hole_number" },
      )
      .select("id, hole_number");

    if (error) {
      console.error("Error upserting holes:", error);
      throw error;
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      holeNumber: row.hole_number,
    }));
  }

  async deleteDrilling(holeId: string): Promise<void> {
    const { error } = await supabase
      .from("hole_drilling")
      .delete()
      .eq("hole_id", holeId);

    if (error) {
      console.error("Error deleting drilling:", error);
    }
  }

  async upsertDrilling(
    holeId: string,
    data: { operatorId: string } & Partial<
      Pick<HoleDrilling, "depth" | "ceiling" | "floor">
    >,
    updatedBy: string,
  ): Promise<void> {
    const { data: existingRow, error: fetchError } = await supabase
      .from("hole_drilling")
      .select("id")
      .eq("hole_id", holeId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error checking drilling before save:", fetchError);
      return;
    }

    const payload = {
      hole_id: holeId,
      ...this.mapDrillingToDb(data, updatedBy),
    };

    const { error } = existingRow
      ? await supabase
          .from("hole_drilling")
          .update(payload)
          .eq("hole_id", holeId)
      : await supabase.from("hole_drilling").insert({
          ...payload,
          updated_by: null,
        });

    if (error) {
      console.error("Error upserting drilling:", error);
    }
  }

  async upsertLoading(
    holeId: string,
    data: { leaderId?: string | null } & Partial<
      Omit<
        HoleLoading,
        "id" | "holeId" | "leaderId" | "createdAt" | "updatedAt" | "updatedBy"
      >
    >,
    updatedBy: string,
  ): Promise<void> {
    const { data: existingRow, error: fetchError } = await supabase
      .from("hole_loading")
      .select("id")
      .eq("hole_id", holeId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error checking loading before save:", fetchError);
      throw fetchError;
    }

    const payload = {
      hole_id: holeId,
      ...this.mapLoadingToDb(data, updatedBy),
    };

    const { error } = existingRow
      ? await supabase
          .from("hole_loading")
          .update(payload)
          .eq("hole_id", holeId)
      : await supabase.from("hole_loading").insert({
          ...payload,
          updated_by: null,
        });

    if (error) {
      console.error("Error upserting loading:", error);
      throw error;
    }
  }

  async upsertLoadingPlan(
    rows: Array<
      {
        holeId: string;
      } & Partial<
        Omit<
          HoleLoading,
          "id" | "holeId" | "leaderId" | "createdAt" | "updatedAt" | "updatedBy"
        >
      >
    >,
    updatedBy: string,
  ): Promise<void> {
    const payload = rows.map((row) => ({
      hole_id: row.holeId,
      ...this.mapLoadingToDb(
        {
          plannedDepth: row.plannedDepth,
          plannedEmulsion: row.plannedEmulsion,
          plannedStemmingInitial: row.plannedStemmingInitial,
          plannedStemmingFinal: row.plannedStemmingFinal,
        },
        updatedBy,
      ),
    }));

    if (payload.length === 0) {
      return;
    }

    const { error } = await supabase
      .from("hole_loading")
      .upsert(payload, { onConflict: "hole_id" });

    if (error) {
      console.error("Error bulk upserting loading plan:", error);
      throw error;
    }
  }

  subscribeHolesByBlast(
    blastId: string,
    cb: (data: HoleFull[]) => void,
  ): () => void {
    return this.subscriptionMgr.subscribeHolesByBlast(
      blastId,
      (id) => this.fetchHolesByBlast(id),
      cb,
    );
  }

  async deleteHole(holeId: string): Promise<void> {
    const { error } = await supabase.from("holes").delete().eq("id", holeId);

    if (error) {
      console.error("Error deleting hole:", error);
    }
  }
}
