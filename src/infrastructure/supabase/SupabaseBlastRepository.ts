import { supabase } from "./supabaseClient";
import {
  Blast,
  BlastFull,
  HoleFull,
  Leader,
  Operator,
  SiteEnum,
} from "../../core/entities/entities";
import { IBlastRepository } from "../../core/interfaces/IBlastRepository";
import { toThreeDecimals } from "./numberFormat";

type DbBlastRow = {
  id: string;
  blast_code: string;
  location: SiteEnum;
  sample_1: number | null;
  sample_2: number | null;
  sample_3: number | null;
  sample_4: number | null;
  final_weight: number | null;
  density_complete: boolean;
  is_complete: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
  updated_by: string | null;
};

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
  leader_id: string;
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

type DbBlastFullRow = DbBlastRow & {
  holes: DbHoleRow[] | null;
};

export class SupabaseBlastRepository implements IBlastRepository {
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

  private mapBlastFromDb(row: DbBlastRow): Blast {
    return {
      id: row.id,
      blastCode: row.blast_code,
      location: row.location,
      sample_1: toThreeDecimals(row.sample_1),
      sample_2: toThreeDecimals(row.sample_2),
      sample_3: toThreeDecimals(row.sample_3),
      sample_4: toThreeDecimals(row.sample_4),
      final_weight: toThreeDecimals(row.final_weight),
      densityComplete: row.density_complete,
      isComplete: row.is_complete,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
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
      drilling: drillingRow
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
            operator: operatorRow ? this.mapOperatorFromDb(operatorRow) : null,
          }
        : null,
      loading: loadingRow
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
            leader: leaderRow ? this.mapLeaderFromDb(leaderRow) : null,
          }
        : null,
    };
  }

  private mapBlastToDb(
    data: Omit<
      Blast,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "updatedBy"
      | "isComplete"
      | "completedAt"
      | "densityComplete"
      | "sample_1"
      | "sample_2"
      | "sample_3"
      | "sample_4"
      | "final_weight"
    >,
  ) {
    return {
      blast_code: data.blastCode,
      location: data.location,
    };
  }

  async createBlast(
    data: Omit<
      Blast,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "updatedBy"
      | "isComplete"
      | "completedAt"
      | "densityComplete"
      | "sample_1"
      | "sample_2"
      | "sample_3"
      | "sample_4"
      | "final_weight"
    >,
  ): Promise<string | null> {
    const { data: result, error } = await supabase
      .from("blasts")
      .insert([this.mapBlastToDb(data)])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating blast:", error);
      return null;
    }

    return result?.id ?? null;
  }

  async findOrCreateBlast(
    data: Omit<
      Blast,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "updatedBy"
      | "isComplete"
      | "completedAt"
      | "densityComplete"
      | "sample_1"
      | "sample_2"
      | "sample_3"
      | "sample_4"
      | "final_weight"
    >,
  ): Promise<string | null> {
    const { data: existing, error } = await supabase
      .from("blasts")
      .select("id")
      .eq("blast_code", data.blastCode)
      .eq("location", data.location)
      .maybeSingle();

    if (error) {
      console.error("Error finding blast:", error);
      return null;
    }

    if (existing?.id) {
      return existing.id;
    }

    return this.createBlast(data);
  }

  async fetchBlastById(id: string): Promise<Blast | null> {
    const { data, error } = await supabase
      .from("blasts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching blast by id:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return this.mapBlastFromDb(data as DbBlastRow);
  }

  async fetchAllBlasts(): Promise<Blast[]> {
    const { data, error } = await supabase
      .from("blasts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all blasts:", error);
      return [];
    }

    return (data ?? []).map((row) => this.mapBlastFromDb(row as DbBlastRow));
  }

  async fetchCargaHeaderData(): Promise<{
    leaders: Leader[];
    blasts: Blast[];
  }> {
    const [
      { data: leaders, error: leadersError },
      { data: blasts, error: blastsError },
    ] = await Promise.all([
      supabase.from("leaders").select("*").order("name"),
      supabase
        .from("blasts")
        .select("*")
        .eq("is_complete", false)
        .order("created_at", { ascending: false }),
    ]);

    if (leadersError) {
      console.error("Error fetching leaders for carga header:", leadersError);
    }

    if (blastsError) {
      console.error("Error fetching blasts for carga header:", blastsError);
    }

    return {
      leaders: (leaders ?? []).map((row) =>
        this.mapLeaderFromDb(row as DbLeaderRow),
      ),
      blasts: (blasts ?? []).map((row) =>
        this.mapBlastFromDb(row as DbBlastRow),
      ),
    };
  }

  async fetchBlastsByDate(date: string): Promise<Blast[]> {
    const { data: operators, error: operatorsError } = await supabase
      .from("operators")
      .select("id")
      .eq("date", date);

    if (operatorsError) {
      console.error("Error fetching operators by date:", operatorsError);
      return [];
    }

    const operatorIds = (operators ?? []).map((row) => row.id);
    if (!operatorIds.length) {
      return [];
    }

    const { data: drillingRows, error: drillingError } = await supabase
      .from("hole_drilling")
      .select("hole_id")
      .in("operator_id", operatorIds);

    if (drillingError) {
      console.error("Error fetching drilling rows by date:", drillingError);
      return [];
    }

    const holeIds = [
      ...new Set((drillingRows ?? []).map((row) => row.hole_id)),
    ];
    if (!holeIds.length) {
      return [];
    }

    const { data: holes, error: holesError } = await supabase
      .from("holes")
      .select("blast_id")
      .in("id", holeIds);

    if (holesError) {
      console.error("Error fetching holes by date:", holesError);
      return [];
    }

    const blastIds = [...new Set((holes ?? []).map((row) => row.blast_id))];
    if (!blastIds.length) {
      return [];
    }

    const { data: blasts, error: blastsError } = await supabase
      .from("blasts")
      .select("*")
      .in("id", blastIds)
      .order("created_at", { ascending: false });

    if (blastsError) {
      console.error("Error fetching blasts by date:", blastsError);
      return [];
    }

    return (blasts ?? []).map((row) => this.mapBlastFromDb(row as DbBlastRow));
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

    return (data ?? []).map((row) => this.mapBlastFromDb(row as DbBlastRow));
  }

  async fetchBlastFull(blastId: string): Promise<BlastFull | null> {
    const { data, error } = await supabase
      .from("blasts")
      .select(
        "*, holes(*, hole_drilling(*, operators(*)), hole_loading(*, leaders(*)))",
      )
      .eq("id", blastId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching full blast:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      ...this.mapBlastFromDb(data as DbBlastRow),
      holes: ((data as DbBlastFullRow).holes ?? [])
        .map((row) => this.mapHoleFromDb(row))
        .sort((a, b) => a.holeNumber - b.holeNumber),
    };
  }

  async fetchBlastFullLoading(blastId: string): Promise<BlastFull | null> {
    const { data, error } = await supabase
      .from("blasts")
      .select("*, holes(*, hole_loading(*, leaders(*)))")
      .eq("id", blastId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching full blast:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      ...this.mapBlastFromDb(data as DbBlastRow),
      holes: ((data as DbBlastFullRow).holes ?? [])
        .map((row) => this.mapHoleFromDb(row))
        .sort((a, b) => a.holeNumber - b.holeNumber),
    };
  }

  async upsertDensity(
    blastId: string,
    patch: Pick<
      Blast,
      "sample_1" | "sample_2" | "sample_3" | "sample_4" | "final_weight"
    >,
    updatedBy: string,
  ): Promise<void> {
    const { error } = await supabase
      .from("blasts")
      .update({
        sample_1: toThreeDecimals(patch.sample_1),
        sample_2: toThreeDecimals(patch.sample_2),
        sample_3: toThreeDecimals(patch.sample_3),
        sample_4: toThreeDecimals(patch.sample_4),
        final_weight: toThreeDecimals(patch.final_weight),
        updated_by: updatedBy,
      })
      .eq("id", blastId);

    if (error) {
      console.error("Error upserting density:", error);
    }
  }

  subscribeBlastsByDate(date: string, cb: (data: Blast[]) => void): () => void {
    const channelName = `blasts:${date}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blasts",
        },
        () => {
          this.fetchBlastsByDate(date).then(cb);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "holes",
        },
        () => {
          this.fetchBlastsByDate(date).then(cb);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hole_drilling",
        },
        () => {
          this.fetchBlastsByDate(date).then(cb);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "operators",
        },
        () => {
          this.fetchBlastsByDate(date).then(cb);
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
