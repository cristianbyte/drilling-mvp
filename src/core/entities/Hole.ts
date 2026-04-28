export interface HoleDrilling {
  depth: number | null;
  ceiling: number | null;
  floor: number | null;
  filledAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface HoleLoading {
  areaLeader: string | null;
  leveling: number | null;
  deck: number | null;
  emulsionTotal: number | null;
  finalStemming: number | null;
  filledAt: string | null;
}

export interface HoleFull {
  id: string;
  blastId: string;
  shiftId: string;
  holeNumber: number;
  createdAt: string;
  drilling: HoleDrilling | null;
  loading: HoleLoading | null;
}

export interface PlannedHole {
  id: string;
  blastId: string;
  holeNumber: number;
  plannedDepth: number | null;
  plannedEmulsion: number | null;
  plannedStemmingInitial: number | null;
  plannedStemmingFinal: number | null;
}

export interface DensityControl {
  id: string;
  blastId: string;
  sample1: number | null;
  sample2: number | null;
  sample3: number | null;
  sample4: number | null;
  finalWeight: number | null;
  isComplete: boolean;
  filledAt: string | null;
}
