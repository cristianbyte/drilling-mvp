export const densityControlFields = [
  { key: "sample_1", label: "Toma 1" },
  { key: "sample_2", label: "Toma 2" },
  { key: "sample_3", label: "Toma 3" },
  { key: "sample_4", label: "Toma 4" },
  { key: "final_weight", label: "Peso final" },
];

export function buildDensityDraft(blast = null) {
  return {
    sample_1: blast?.sample_1 ?? null,
    sample_2: blast?.sample_2 ?? null,
    sample_3: blast?.sample_3 ?? null,
    sample_4: blast?.sample_4 ?? null,
    final_weight: blast?.final_weight ?? null,
    synced: true,
  };
}

export function hasDensityData(draft) {
  if (!draft) return false;

  return densityControlFields.some(({ key }) => {
    const value = draft[key];
    return value !== null && value !== "";
  });
}

export function buildDensityPayload(draft) {
  return {
    sample_1: draft?.sample_1 ?? null,
    sample_2: draft?.sample_2 ?? null,
    sample_3: draft?.sample_3 ?? null,
    sample_4: draft?.sample_4 ?? null,
    final_weight: draft?.final_weight ?? null,
  };
}
