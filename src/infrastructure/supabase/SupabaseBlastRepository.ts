import { supabase } from "./supabaseClient";
import { Blast, SiteEnum } from "../../core/entities/Blast";
import { IBlastRepository } from "../../core/interfaces/IBlastRepository";

export class SupabaseBlastRepository implements IBlastRepository {
  private mapFromDb(row: any): Blast {
    return {
      id: row.id,
      location: row.location,
      blastCode: row.blast_code,
      leader: row.leader,
      date: row.date,
      isComplete: row.is_complete,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  }

  private mapToDb(data: any): any {
    return {
      blast_code: data.blastCode,
      leader: data.leader,
      location: data.location,
      date: data.date,
    };
  }

  async createBlast(
    data: Omit<Blast, "id" | "createdAt" | "completedAt" | "isComplete">,
  ): Promise<string | null> {
    const { data: result, error } = await supabase
      .from("blasts")
      .insert([this.mapToDb(data)])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating blast:", error);
      return null;
    }

    return result?.id ?? null;
  }

  async fetchBlastsByDate(date: string): Promise<Blast[]> {
    const { data, error } = await supabase
      .from("blasts")
      .select("*")
      .eq("date", date)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching blasts by date:", error);
      return [];
    }

    return (data ?? []).map((row) => this.mapFromDb(row));
  }

  async fetchBlastById(blastId: string): Promise<Blast | null> {
    const { data, error } = await supabase
      .from("blasts")
      .select("*")
      .eq("id", blastId)
      .single();

    if (error) {
      console.error("Error fetching blast by id:", error);
      return null;
    }

    return this.mapFromDb(data);
  }

  async fetchBlastsByLocation(location: SiteEnum): Promise<Blast[]> {
    const { data, error } = await supabase
      .from("blasts")
      .select("*")
      .eq("location", location)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching blasts by location:", error);
      return [];
    }

    return (data ?? []).map((row) => this.mapFromDb(row));
  }

  async fetchIncompleteBlasts(): Promise<Blast[]> {
    const { data, error } = await supabase
      .from("blasts")
      .select("*")
      .eq("is_complete", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching incomplete blasts:", error);
      return [];
    }

    return (data ?? []).map((row) => this.mapFromDb(row));
  }

  subscribeBlastsByDate(
    date: string,
    callback: (data: Blast[]) => void,
  ): () => void {
    const channelName = `blasts:${date}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blasts",
          filter: `date=eq.${date}`,
        },
        () => {
          this.fetchBlastsByDate(date).then(callback);
        },
      )
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(`Realtime ${channelName} status:`, status, error);
        }

        if (status === "SUBSCRIBED") {
          console.info(`Realtime ${channelName} subscribed`);
        }
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }
}
