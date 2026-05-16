import { supabase } from "./supabaseClient";
import { toThreeDecimals } from "./numberFormat";

type DbLeaderRow = {
  id: string;
  name: string;
  created_at: string;
};

type DbAccessoryUsageRow = {
  id: string;
  blast_id: string;
  leader_id: string;
  usage_date: string;
  ikon15m: number;
  p337: number;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  updated_by: string | null;
  leaders: DbLeaderRow | DbLeaderRow[] | null;
};

export class SupabaseAccessoryUsageRepository {
  private getRelationOne<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    return value ?? null;
  }

  private mapFromDb(row: DbAccessoryUsageRow) {
    const leader = this.getRelationOne(row.leaders);

    return {
      id: row.id,
      blastId: row.blast_id,
      leaderId: row.leader_id,
      usageDate: row.usage_date,
      ikon15m: toThreeDecimals(row.ikon15m) ?? 0,
      p337: toThreeDecimals(row.p337) ?? 0,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      updatedBy: row.updated_at ? row.updated_by : null,
      createdBy: leader?.name || row.updated_by || "Lider",
      synced: true,
    };
  }

  async listByBlastId(blastId: string) {
    const { data, error } = await supabase
      .from("accessory_usage")
      .select("*, leaders(id,name,created_at)")
      .eq("blast_id", blastId)
      .order("usage_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching accessory usage:", error);
      throw error;
    }

    return ((data as DbAccessoryUsageRow[] | null) ?? []).map((row) =>
      this.mapFromDb(row),
    );
  }

  async create(data: {
    blastId: string;
    leaderId: string;
    usageDate: string;
    ikon15m: number;
    p337: number;
    notes: string | null;
  }) {
    const { data: created, error } = await supabase
      .from("accessory_usage")
      .insert({
        blast_id: data.blastId,
        leader_id: data.leaderId,
        usage_date: data.usageDate,
        ikon15m: data.ikon15m,
        p337: data.p337,
        notes: data.notes,
        updated_by: null,
      })
      .select("*, leaders(id,name,created_at)")
      .single();

    if (error) {
      console.error("Error creating accessory usage:", error);
      throw error;
    }

    return created ? this.mapFromDb(created as DbAccessoryUsageRow) : null;
  }

  async update(
    id: string,
    data: {
      usageDate: string;
      ikon15m: number;
      p337: number;
      notes: string | null;
    },
    updatedBy: string,
  ) {
    const updatedAt = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("accessory_usage")
      .update({
        usage_date: data.usageDate,
        ikon15m: data.ikon15m,
        p337: data.p337,
        notes: data.notes,
        updated_at: updatedAt,
        updated_by: updatedBy,
      })
      .eq("id", id)
      .select("*, leaders(id,name,created_at)")
      .single();

    if (error) {
      console.error("Error updating accessory usage:", error);
      throw error;
    }

    return updated ? this.mapFromDb(updated as DbAccessoryUsageRow) : null;
  }

  async remove(id: string) {
    const { error } = await supabase
      .from("accessory_usage")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting accessory usage:", error);
      throw error;
    }
  }
}
