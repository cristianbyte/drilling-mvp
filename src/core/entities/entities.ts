export type WorkShift = "DIA" | "NOCHE";
export type SiteEnum = "HATILO NORTE" | "HATILO SUR";

// tabla: operators — 1 operator → N hole_drilling
// lleva contexto turno (shift_type, equipment, date, elevation, pattern, diameter)
export interface Operator {
  id: string;
  name: string;
  shiftType: WorkShift;
  equipment: string;
  date: string;
  elevation: number | null;
  pattern: string | null;
  diameter: number | null;
  createdAt: string;
}

// tabla: leaders — 1 leader → N hole_loading
export interface Leader {
  id: string;
  name: string;
  createdAt: string;
}

// tabla: blasts — density embebido, trigger DB maneja densityComplete + isComplete
// 1 blast → N holes
export interface Blast {
  id: string;
  blastCode: string;
  location: SiteEnum;
  sample_1: number | null;
  sample_2: number | null;
  sample_3: number | null;
  sample_4: number | null;
  final_weight: number | null;
  densityComplete: boolean; // trigger DB — nunca computar en frontend
  isComplete: boolean; // trigger DB — nunca computar en frontend
  completedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

// tabla: holes — pivote. unique(blast_id, hole_number)
// 1 hole → 1 HoleDrilling, 1 hole → 1 HoleLoading
export interface Hole {
  id: string;
  blastId: string; // FK → blasts.id
  holeNumber: number;
  createdAt: string;
}

// tabla: hole_drilling — formulario perforación
// 1-1 con hole (UNIQUE hole_id), N-1 con operator
// turno/equipo/fecha/cota/patron/diametro → operator (JOIN), no se repite aquí
export interface HoleDrilling {
  id: string;
  holeId: string; // FK → holes.id (UNIQUE)
  operatorId: string; // FK → operators.id
  depth: number | null;
  ceiling: number | null;
  floor: number | null;
  createdAt: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

// tabla: hole_loading — formulario carga
// 1-1 con hole (UNIQUE hole_id), N-1 con leader
// planned* → precarga supervisor | leveling/deck/emulsion/stemming → líder de carga
export interface HoleLoading {
  id: string;
  holeId: string; // FK → holes.id (UNIQUE)
  leaderId: string | null; // FK → leaders.id
  plannedDepth: number | null;
  plannedEmulsion: number | null;
  plannedStemmingInitial: number | null;
  plannedStemmingFinal: number | null;
  leveling: number | null;
  deck: number | null;
  emulsionTotal: number | null;
  stemmingFinal: number | null;
  createdAt: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

// JOIN: holes + hole_drilling(+operator) + hole_loading(+leader)
export interface HoleFull extends Hole {
  drilling: (HoleDrilling & { operator: Operator | null }) | null;
  loading: (HoleLoading & { leader: Leader | null }) | null;
}

// JOIN: blast + all HoleFull — vista supervisor
export interface BlastFull extends Blast {
  holes: HoleFull[];
}

// ELIMINADAS:
// Shift          → campos → Operator
// PlannedHole    → campos → HoleLoading
// DensityControl → campos → Blast
