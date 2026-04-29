import { Leader } from "../../core/entities/entities";
import { ILeaderRepository } from "../../core/interfaces/ILeaderRepository";
import { supabase } from "./supabaseClient";

type DbLeaderRow = {
  id: string;
  name: string;
  created_at: string;
};

export class SupabaseLeaderRepository implements ILeaderRepository {
  private mapFromDb(row: DbLeaderRow): Leader {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  async fetchAll(): Promise<Leader[]> {
    const { data, error } = await supabase
      .from("leaders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching leaders:", error);
      return [];
    }

    return (data ?? []).map((row) => this.mapFromDb(row as DbLeaderRow));
  }

  async fetchById(id: string): Promise<Leader | null> {
    const { data, error } = await supabase
      .from("leaders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching leader by id:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return this.mapFromDb(data as DbLeaderRow);
  }

  async create(name: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("leaders")
      .insert([{ name }])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating leader:", error);
      return null;
    }

    return data?.id ?? null;
  }
}
