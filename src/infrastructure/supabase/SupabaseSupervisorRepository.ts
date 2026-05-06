import {
  Blast,
  BlastFull,
  HoleFull,
  SiteEnum,
} from "../../core/entities/entities";
import {
  ISupervisorRepository,
  SupervisorDrillingRow,
  SupervisorLoadingSnapshot,
} from "../../core/interfaces/ISupervisorRepository";
import { SubscriptionManager } from "./SubscriptionManager";
import { supabase, supabaseReady } from "./supabaseClient";

function getDateKey(value: string, timeZone = "UTC") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

// Normalizes text by removing accents, trimming whitespace, and converting to uppercase
function normalizeText(value: string | null | undefined) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

type DbSupervisorDrillingRow = {
  drilling_id: string | null;
  depth: number | null;
  ceiling: number | null;
  floor: number | null;
  created_at: string | null;
  updated_at: string | null;
  updated_by: string | null;
  hole_id: string | null;
  hole_number: number | null;
  blast_id: string | null;
  planned_depth: number | null;
  operator_id: string | null;
  operator_name: string | null;
  equipment: string | null;
  shift_type: string | null;
  pattern: string | null;
  diameter: number | null;
  elevation: number | null;
  recency: string | null;
};

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

type DbSupervisorLoadingRow = Record<string, unknown>;

type SupervisorLoadingViewRow = {
  blastCode: string | null;
  location: string | null;
  densityComplete: boolean;
  isComplete: boolean;
  holeNumber: number | null;
  loadingId: string | null;
  leaderName: string | null;
  plannedDepth: number | null;
  plannedEmulsion: number | null;
  plannedStemmingInitial: number | null;
  plannedStemmingFinal: number | null;
  leveling: number | null;
  deck: number | null;
  emulsionTotal: number | null;
  stemmingFinal: number | null;
  loadingCreatedAt: string | null;
  loadingUpdatedAt: string | null;
  loadingUpdatedBy: string | null;
  recency: string | null;
};

const supervisorSubscriptionManager = new SubscriptionManager();

export class SupabaseSupervisorRepository implements ISupervisorRepository {
  private pickValue(row: DbSupervisorLoadingRow, keys: string[]) {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null) {
        return value;
      }
    }

    return null;
  }

  private readString(row: DbSupervisorLoadingRow, keys: string[]) {
    const value = this.pickValue(row, keys);
    if (value === null) {
      return null;
    }

    const normalized = String(value).trim();
    return normalized || null;
  }

  private readNumber(row: DbSupervisorLoadingRow, keys: string[]) {
    const value = this.pickValue(row, keys);
    if (value === null || value === "") {
      return null;
    }

    const normalized = Number(value);
    return Number.isNaN(normalized) ? null : normalized;
  }

  private readBoolean(row: DbSupervisorLoadingRow, keys: string[]) {
    const value = this.pickValue(row, keys);
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value !== 0;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "t", "1", "yes", "si"].includes(normalized)) {
        return true;
      }

      if (["false", "f", "0", "no"].includes(normalized)) {
        return false;
      }
    }

    return false;
  }

  private mapSupervisorDrillingRow(
    row: DbSupervisorDrillingRow,
  ): SupervisorDrillingRow {
    return {
      drillingId: row.drilling_id,
      depth: row.depth,
      ceiling: row.ceiling,
      floor: row.floor,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      holeId: row.hole_id,
      holeNumber: row.hole_number,
      blastId: row.blast_id,
      plannedDepth: row.planned_depth,
      operatorId: row.operator_id,
      operatorName: row.operator_name,
      equipment: row.equipment,
      shift: row.shift_type,
      pattern: row.pattern,
      diameter: row.diameter,
      elevation: row.elevation,
      recency: row.recency,
      date: row.created_at ? getDateKey(row.created_at) : null,
    };
  }

  private mapSupervisorLoadingRow(
    row: DbSupervisorLoadingRow,
  ): SupervisorLoadingViewRow {
    return {
      blastCode: this.readString(row, ["blast_code", "blastCode"]),
      location: this.readString(row, ["location"]),
      densityComplete: this.readBoolean(row, [
        "density_complete",
        "densityComplete",
      ]),
      isComplete: this.readBoolean(row, [
        "blast_complete",
        "is_complete",
        "isComplete",
      ]),
      holeNumber: this.readNumber(row, ["hole_number", "holeNumber"]),
      loadingId: this.readString(row, ["loading_id", "hole_loading_id"]),
      leaderName: this.readString(row, ["leader_name", "leaderName"]),
      plannedDepth: this.readNumber(row, ["planned_depth", "plannedDepth"]),
      plannedEmulsion: this.readNumber(row, [
        "planned_emulsion",
        "plannedEmulsion",
      ]),
      plannedStemmingInitial: this.readNumber(row, [
        "planned_stemming_initial",
        "plannedStemmingInitial",
      ]),
      plannedStemmingFinal: this.readNumber(row, [
        "planned_stemming_final",
        "plannedStemmingFinal",
      ]),
      leveling: this.readNumber(row, ["leveling"]),
      deck: this.readNumber(row, ["deck"]),
      emulsionTotal: this.readNumber(row, ["emulsion_total", "emulsionTotal"]),
      stemmingFinal: this.readNumber(row, ["stemming_final", "stemmingFinal"]),
      loadingCreatedAt: this.readString(row, [
        "loading_created_at",
        "created_at",
      ]),
      loadingUpdatedAt: this.readString(row, [
        "loading_updated_at",
        "updated_at",
      ]),
      loadingUpdatedBy: this.readString(row, [
        "loading_updated_by",
        "updated_by",
      ]),
      recency: this.readString(row, ["recency"]),
    };
  }

  private mapBlastFromDb(row: DbBlastRow): Blast {
    return {
      id: row.id,
      blastCode: row.blast_code,
      location: row.location,
      sample_1: row.sample_1,
      sample_2: row.sample_2,
      sample_3: row.sample_3,
      sample_4: row.sample_4,
      final_weight: row.final_weight,
      densityComplete: row.density_complete,
      isComplete: row.is_complete,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    };
  }

  private buildEmptyLoadingSnapshot(): SupervisorLoadingSnapshot {
    return {
      blasts: [],
      blastFullById: {},
    };
  }

  private mapLoadingSnapshot(
    rows: DbSupervisorLoadingRow[],
    blastsSeed: Blast[] = [],
  ) {
    const grouped = new Map<
      string,
      { blast: BlastFull; holesById: Map<string, HoleFull> }
    >();

    for (const blast of blastsSeed) {
      grouped.set(blast.id, {
        blast: {
          ...blast,
          holes: [],
        },
        holesById: new Map<string, HoleFull>(),
      });
    }

    const mappedRows = rows
      .map((row) => this.mapSupervisorLoadingRow(row))
      .sort((a, b) => {
        if ((a.blastCode || "") !== (b.blastCode || "")) {
          return (a.blastCode || "").localeCompare(b.blastCode || "");
        }

        return (a.holeNumber ?? 0) - (b.holeNumber ?? 0);
      });

    for (const row of mappedRows) {
      const blast = blastsSeed.find(
        (item) =>
          normalizeText(item.blastCode) === normalizeText(row.blastCode) &&
          normalizeText(item.location) === normalizeText(row.location),
      );

      if (!blast) {
        continue;
      }

      const blastId = blast.id;

      let current = grouped.get(blastId);

      if (!current) {
        current = {
          blast: {
            ...blast,
            densityComplete: row.densityComplete,
            isComplete: row.isComplete,
            holes: [],
          },
          holesById: new Map<string, HoleFull>(),
        };

        grouped.set(blastId, current);
      }

      const holeId = `${blastId}:${String(row.holeNumber ?? 0).padStart(3, "0")}`;

      if (current.holesById.has(holeId)) {
        continue;
      }

      const hasLoadingData =
        row.loadingId ||
        row.leaderName ||
        row.plannedDepth !== null ||
        row.plannedEmulsion !== null ||
        row.plannedStemmingInitial !== null ||
        row.plannedStemmingFinal !== null ||
        row.leveling !== null ||
        row.deck !== null ||
        row.emulsionTotal !== null ||
        row.stemmingFinal !== null;

      current.holesById.set(holeId, {
        id: holeId,
        blastId,
        holeNumber: row.holeNumber ?? 0,
        createdAt:
          row.loadingCreatedAt || row.loadingUpdatedAt || blast.createdAt,
        drilling: null,
        loading: hasLoadingData
          ? {
              id: row.loadingId || `${holeId}:loading`,
              holeId,
              leaderId: null,
              plannedDepth: row.plannedDepth,
              plannedEmulsion: row.plannedEmulsion,
              plannedStemmingInitial: row.plannedStemmingInitial,
              plannedStemmingFinal: row.plannedStemmingFinal,
              leveling: row.leveling,
              deck: row.deck,
              emulsionTotal: row.emulsionTotal,
              stemmingFinal: row.stemmingFinal,
              createdAt: row.loadingCreatedAt || row.recency || blast.createdAt,
              updatedAt: row.loadingUpdatedAt || row.recency,
              updatedBy: row.loadingUpdatedBy,
              leader: row.leaderName
                ? {
                    id: `leader:${normalizeText(row.leaderName)}`,
                    name: row.leaderName,
                    createdAt: "",
                  }
                : null,
            }
          : null,
      });
    }

    const blasts = [...grouped.values()]
      .map(({ blast, holesById }) => {
        blast.holes = [...holesById.values()].sort(
          (a, b) => a.holeNumber - b.holeNumber,
        );

        return blast;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );

    return {
      blasts: blasts.map(({ holes, ...blast }) => blast),
      blastFullById: Object.fromEntries(
        blasts.map((blast) => [blast.id, blast]),
      ),
    } satisfies SupervisorLoadingSnapshot;
  }

  async fetchLatestDrillingRows(limit = 100): Promise<SupervisorDrillingRow[]> {
    if (!supabaseReady) {
      return [];
    }

    const { data, error } = await supabase
      .from("v_supervisor_holes")
      .select("*")
      .order("recency", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching supervisor drilling rows:", error);
      return [];
    }

    return (data || []).map((row) =>
      this.mapSupervisorDrillingRow(row as DbSupervisorDrillingRow),
    );
  }

  async fetchDrillingRowsByDate(
    date: string,
    timeZone?: string,
  ): Promise<SupervisorDrillingRow[]> {
    const rows = await this.fetchLatestDrillingRows(100);

    return rows.filter(
      (row) => row.createdAt && getDateKey(row.createdAt, timeZone) === date,
    );
  }

  subscribeDrillingRows(
    options: { limit?: number; date?: string },
    cb: (data: SupervisorDrillingRow[]) => void,
  ): () => void {
    if (!supabaseReady) {
      return () => {};
    }

    return supervisorSubscriptionManager.subscribeSupervisorRows(
      options,
      () => this.fetchLatestDrillingRows(options.limit ?? 100),
      cb,
    );
  }

  async fetchLoadingSnapshot(): Promise<SupervisorLoadingSnapshot> {
    if (!supabaseReady) {
      return this.buildEmptyLoadingSnapshot();
    }

    const [
      { data: blasts, error: blastsError },
      { data: rows, error: rowsError },
    ] = await Promise.all([
      supabase
        .from("blasts")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("v_supervisor_holes_loading").select("*"),
    ]);

    if (blastsError) {
      console.error("Error fetching supervisor carga blasts:", blastsError);
    }

    if (rowsError) {
      console.error("Error fetching supervisor loading rows:", rowsError);
    }

    if (blastsError && rowsError) {
      return this.buildEmptyLoadingSnapshot();
    }

    return this.mapLoadingSnapshot(
      (rows || []) as DbSupervisorLoadingRow[],
      ((blasts || []) as DbBlastRow[]).map((row) => this.mapBlastFromDb(row)),
    );
  }

  subscribeLoadingSnapshot(
    cb: (data: SupervisorLoadingSnapshot) => void,
  ): () => void {
    if (!supabaseReady) {
      return () => {};
    }

    return supervisorSubscriptionManager.subscribeSupervisorLoadingRows(
      () => this.fetchLoadingSnapshot(),
      (data: Record<string, any>) => cb(data as SupervisorLoadingSnapshot),
    );
  }
}
