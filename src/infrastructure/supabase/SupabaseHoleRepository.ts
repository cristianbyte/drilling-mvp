import { supabase } from "./supabaseClient";
import { HoleFull, HoleDrilling, HoleLoading } from "../../core/entities/Hole";
import { IHoleRepository } from "../../core/interfaces/IHoleRepository";
import { SubscriptionManager } from "./SubscriptionManager";

export class SupabaseHoleRepository implements IHoleRepository {
  private subscriptionMgr: SubscriptionManager;

  constructor(
    subscriptionMgr: SubscriptionManager = new SubscriptionManager(),
  ) {
    this.subscriptionMgr = subscriptionMgr;
  }

  private getRelationOne<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  }

  private mapDrillingFromDb(row: any): HoleDrilling | null {
    if (!row) return null;
    return {
      depth: row.depth,
      ceiling: row.ceiling,
      floor: row.floor,
      filledAt: row.filled_at,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    };
  }

  private mapLoadingFromDb(row: any): HoleLoading | null {
    if (!row) return null;
    return {
      areaLeader: row.area_leader,
      leveling: row.leveling,
      deck: row.deck,
      emulsionTotal: row.emulsion_total,
      finalStemming: row.final_stemming,
      filledAt: row.filled_at,
    };
  }

  private mapHoleFromDb(row: any): HoleFull {
    return {
      id: row.id,
      blastId: row.blast_id,
      shiftId: row.shift_id,
      holeNumber: row.hole_number,
      createdAt: row.created_at,
      drilling: this.mapDrillingFromDb(row.hole_drilling?.[0]),
      loading: this.mapLoadingFromDb(row.hole_loading?.[0]),
    };
  }

  private mapDrillingCreateToDb(data: Partial<HoleDrilling>): any {
    const mapped: any = {};
    if (data.depth !== undefined) mapped.depth = data.depth;
    if (data.ceiling !== undefined) mapped.ceiling = data.ceiling;
    if (data.floor !== undefined) mapped.floor = data.floor;
    if (data.filledAt !== undefined) mapped.filled_at = data.filledAt;
    mapped.updated_at = null;
    mapped.updated_by = null;
    return mapped;
  }

  private mapDrillingUpdateToDb(data: Partial<HoleDrilling>): any {
    const mapped: any = {};
    if (data.depth !== undefined) mapped.depth = data.depth;
    if (data.ceiling !== undefined) mapped.ceiling = data.ceiling;
    if (data.floor !== undefined) mapped.floor = data.floor;
    if (data.filledAt !== undefined) mapped.filled_at = data.filledAt;
    if (data.updatedBy !== undefined) mapped.updated_by = data.updatedBy;
    mapped.updated_at = new Date().toISOString();
    return mapped;
  }

  private mapLoadingToDb(data: Partial<HoleLoading>): any {
    const mapped: any = {};
    if (data.areaLeader !== undefined) mapped.area_leader = data.areaLeader;
    if (data.leveling !== undefined) mapped.leveling = data.leveling;
    if (data.deck !== undefined) mapped.deck = data.deck;
    if (data.emulsionTotal !== undefined)
      mapped.emulsion_total = data.emulsionTotal;
    if (data.finalStemming !== undefined)
      mapped.final_stemming = data.finalStemming;
    if (data.filledAt !== undefined) mapped.filled_at = data.filledAt;
    return mapped;
  }

  private createSupervisorRowsQuery(options?: {
    limit?: number;
    date?: string;
  }) {
    let query = supabase
      .from("holes")
      .select(
        `
        id,
        shift_id,
        hole_number,
        created_at,
        hole_drilling(depth, ceiling, floor, updated_at, updated_by),
        shifts!inner(
          id,
          blast_id,
          operator_name,
          equipment,
          shift_type,
          date,
          diameter,
          elevation,
          pattern,
          blasts(id, location, blast_code)
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (options?.date) {
      query = query.eq("shifts.date", options.date);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return query;
  }

  private mapSupervisorRow(row: any): any {
    const drilling = this.getRelationOne(row.hole_drilling);
    const shift = this.getRelationOne(row.shifts);
    const blast = this.getRelationOne(shift?.blasts);

    return {
      holeId: row.id,
      shiftId: row.shift_id,
      holeNumber: row.hole_number,
      depth: drilling?.depth ?? null,
      ceiling: drilling?.ceiling ?? null,
      floor: drilling?.floor ?? null,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : null,
      updatedAt: drilling?.updated_at
        ? new Date(drilling.updated_at).getTime()
        : null,
      updatedBy: drilling?.updated_by ?? null,
      location: blast?.location ?? "-",
      operatorName: shift?.operator_name ?? "-",
      equipment: shift?.equipment ?? "-",
      blastId: blast?.blast_code ?? shift?.blast_id ?? "-",
      blastCode: blast?.blast_code ?? "-",
      shift: shift?.shift_type ?? "-",
      date: shift?.date ?? "",
      diameter: shift?.diameter ?? null,
      elevation: shift?.elevation ?? null,
      pattern: shift?.pattern ?? "",
    };
  }

  async createHole(
    blastId: string,
    shiftId: string,
    holeNumber: number,
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from("holes")
      .insert([
        {
          blast_id: blastId,
          shift_id: shiftId,
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
        hole_drilling(*),
        hole_loading(*)
      `,
      )
      .eq("blast_id", blastId)
      .order("hole_number", { ascending: true });

    if (error) {
      console.error("Error fetching holes by blast:", error);
      return [];
    }

    return (data ?? []).map((row) => this.mapHoleFromDb(row));
  }

  async updateDrilling(
    holeId: string,
    data: Partial<HoleDrilling>,
    updatedBy: string,
  ): Promise<void> {
    const mapped = this.mapDrillingUpdateToDb({ ...data, updatedBy });

    // First check if drilling record exists
    const { data: existing } = await supabase
      .from("hole_drilling")
      .select("id")
      .eq("hole_id", holeId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("hole_drilling")
        .update(mapped)
        .eq("hole_id", holeId);

      if (error) {
        console.error("Error updating drilling:", error);
      }
    } else {
      const { error } = await supabase
        .from("hole_drilling")
        .insert([{ hole_id: holeId, ...mapped }]);

      if (error) {
        console.error("Error inserting drilling:", error);
      }
    }
  }

  async updateLoading(
    holeId: string,
    data: Partial<HoleLoading>,
  ): Promise<void> {
    const mapped = this.mapLoadingToDb(data);

    // First check if loading record exists
    const { data: existing } = await supabase
      .from("hole_loading")
      .select("id")
      .eq("hole_id", holeId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("hole_loading")
        .update(mapped)
        .eq("hole_id", holeId);

      if (error) {
        console.error("Error updating loading:", error);
      }
    } else {
      const { error } = await supabase
        .from("hole_loading")
        .insert([{ hole_id: holeId, ...mapped }]);

      if (error) {
        console.error("Error inserting loading:", error);
      }
    }
  }

  subscribeHolesByBlast(
    blastId: string,
    callback: (data: HoleFull[]) => void,
  ): () => void {
    return this.subscriptionMgr.subscribeHolesByBlast(
      blastId,
      (id) => this.fetchHolesByBlast(id),
      callback,
    );
  }

  async deleteHole(holeId: string): Promise<void> {
    const { error } = await supabase.from("holes").delete().eq("id", holeId);

    if (error) {
      console.error("Error deleting hole:", error);
    }
  }

  // Bridge methods for offline sync compatibility
  async upsertHole(
    holeId: string,
    shiftId: string,
    data: any,
  ): Promise<string | null> {
    const { error } = await supabase.from("holes").upsert({
      id: holeId,
      shift_id: shiftId,
      blast_id: data.blastId,
      hole_number: data.holeNumber,
    });

    if (error) {
      console.error("Error upserting hole:", error);
      return null;
    }

    // If there's drilling data, upsert that too
    if (
      data.depth !== undefined ||
      data.ceiling !== undefined ||
      data.floor !== undefined
    ) {
      const drillingData = this.mapDrillingCreateToDb({
        depth: data.depth,
        ceiling: data.ceiling,
        floor: data.floor,
      });

      const { error: drillingError } = await supabase
        .from("hole_drilling")
        .upsert(
          {
            hole_id: holeId,
            ...drillingData,
          },
          { onConflict: "hole_id" },
        );

      if (drillingError) {
        console.error("Error upserting hole drilling:", drillingError);
      }
    }

    return holeId;
  }

  async holeExists(holeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("holes")
      .select("id")
      .eq("id", holeId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking hole existence:", error);
    }

    return !!data;
  }

  async updateHole(
    holeId: string,
    patch: any,
    name: string,
  ): Promise<string | null> {
    const mapped = this.mapDrillingUpdateToDb({
      depth: patch.depth,
      ceiling: patch.ceiling,
      floor: patch.floor,
      updatedBy: name,
    });

    const { error } = await supabase.from("hole_drilling").upsert(
      {
        hole_id: holeId,
        ...mapped,
      },
      { onConflict: "hole_id" },
    );

    if (error) {
      console.error("Error updating hole:", error);
      return null;
    }

    return holeId;
  }

  // Bridge methods for SupervisorDashboard
  async fetchHolesByShiftIds(shiftIds: string[]): Promise<Record<string, any>> {
    if (!shiftIds.length) return {};

    const { data, error } = await supabase
      .from("holes")
      .select(
        `
        *,
        hole_drilling(*),
        hole_loading(*)
      `,
      )
      .in("shift_id", shiftIds)
      .order("hole_number", { ascending: true });

    if (error) {
      console.error("Error fetching holes by shift ids:", error);
      return {};
    }

    const result: Record<string, any> = {};
    (data ?? []).forEach((row) => {
      const hole = this.mapHoleFromDb(row);
      result[hole.id] = {
        holeId: hole.id,
        shiftId: hole.shiftId,
        holeNumber: hole.holeNumber,
        depth: hole.drilling?.depth,
        ceiling: hole.drilling?.ceiling,
        floor: hole.drilling?.floor,
        createdAt: new Date(hole.createdAt).getTime(),
        updatedAt: hole.drilling?.updatedAt
          ? new Date(hole.drilling.updatedAt).getTime()
          : null,
        updatedBy: hole.drilling?.updatedBy,
      };
    });

    return result;
  }

  async fetchSupervisorRows(options?: {
    limit?: number;
    date?: string;
  }): Promise<any[]> {
    const { data, error } = await this.createSupervisorRowsQuery(options);

    if (error) {
      console.error("Error fetching supervisor rows:", error);
      return [];
    }

    return (data ?? []).map((row) => this.mapSupervisorRow(row));
  }

  subscribeSupervisorRows(
    options: { limit?: number; date?: string },
    callback: (data: any[]) => void,
  ): () => void {
    return this.subscriptionMgr.subscribeSupervisorRows(
      options,
      () => this.fetchSupervisorRows(options),
      callback,
    );
  }

  subscribeRecentHoles(
    limit: number,
    callback: (data: Record<string, any>) => void,
  ): () => void {
    return this.subscriptionMgr.subscribeRecentHoles(
      limit,
      (l) => this.getRecentHolesAsRecord(l),
      callback,
    );
  }

  private async getRecentHolesAsRecord(
    limit: number,
  ): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from("holes")
      .select(`*, hole_drilling(*), hole_loading(*)`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent holes:", error);
      return {};
    }

    const result: Record<string, any> = {};
    (data ?? []).forEach((row) => {
      const hole = this.mapHoleFromDb(row);
      result[hole.id] = {
        holeId: hole.id,
        shiftId: hole.shiftId,
        holeNumber: hole.holeNumber,
        depth: hole.drilling?.depth,
        ceiling: hole.drilling?.ceiling,
        floor: hole.drilling?.floor,
        createdAt: new Date(hole.createdAt).getTime(),
        updatedAt: hole.drilling?.updatedAt
          ? new Date(hole.drilling.updatedAt).getTime()
          : null,
        updatedBy: hole.drilling?.updatedBy,
      };
    });

    return result;
  }
}
