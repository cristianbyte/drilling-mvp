import { Operator } from "../../core/entities/entities";
import { IOperatorRepository } from "../../core/interfaces/IOperatorRepository";
import { supabase } from "./supabaseClient";

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

export class SupabaseOperatorRepository implements IOperatorRepository {
  private mapFromDb(row: DbOperatorRow): Operator {
    return {
      id: row.id,
      name: row.name,
      shiftType: row.shift_type,
      equipment: row.equipment,
      date: row.date,
      elevation: row.elevation,
      pattern: row.pattern,
      diameter: row.diameter,
      createdAt: row.created_at,
    };
  }

  private mapToDb(data: Omit<Operator, "id" | "createdAt">) {
    return {
      name: data.name,
      shift_type: data.shiftType,
      equipment: data.equipment,
      date: data.date,
      elevation: data.elevation,
      pattern: data.pattern,
      diameter: data.diameter,
    };
  }

  async fetchAll(): Promise<Operator[]> {
    const { data, error } = await supabase
      .from("operators")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching operators:", error);
      return [];
    }

    return (data ?? []).map((row) => this.mapFromDb(row as DbOperatorRow));
  }

  async fetchById(id: string): Promise<Operator | null> {
    const { data, error } = await supabase
      .from("operators")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching operator by id:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return this.mapFromDb(data as DbOperatorRow);
  }

  async create(data: Omit<Operator, "id" | "createdAt">): Promise<string | null> {
    const { data: result, error } = await supabase
      .from("operators")
      .insert([this.mapToDb(data)])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating operator:", error);
      return null;
    }

    return result?.id ?? null;
  }
}
