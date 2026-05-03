import * as XLSX from "xlsx";

const EMPTY = "";

const COLUMN_CONFIG = [
  ["Voladura", (blastFull) => blastFull.blastCode || EMPTY],
  ["Ubicacion", (blastFull) => blastFull.location || EMPTY],
  ["Barreno", (_, hole) => hole.holeNumber ?? EMPTY],
  ["Lider", (_, hole) => hole.loading?.leader?.name || EMPTY],
  ["Profundidad Diseño", (_, hole) => formatNumber(hole.loading?.plannedDepth)],
  [
    "Emulsion Total Diseño",
    (_, hole) => formatNumber(hole.loading?.plannedEmulsion),
  ],
  [
    "Retacado inicial",
    (_, hole) => formatNumber(hole.loading?.plannedStemmingInitial),
  ],
  [
    "Retacado final Diseño",
    (_, hole) => formatNumber(hole.loading?.plannedStemmingFinal),
  ],
  ["Nivelacion", (_, hole) => formatNumber(hole.loading?.leveling)],
  ["Deck", (_, hole) => formatNumber(hole.loading?.deck)],
  ["Emulsion total", (_, hole) => formatNumber(hole.loading?.emulsionTotal)],
  [
    "Retacado final Real",
    (_, hole) => formatNumber(hole.loading?.stemmingFinal),
  ],
  ["Actualizado por", (_, hole) => hole.loading?.updatedBy || EMPTY],
  ["Actualizado en", (_, hole) => hole.loading?.updatedAt || EMPTY],
];

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return EMPTY;

  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric;
}

function buildFileName(blastFull) {
  const blastCode = String(blastFull.blastCode || "sin-voladura")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "");

  return `carga-${blastCode || "sin-voladura"}.xlsx`;
}

export function exportSupervisorCargaToXlsx(blastFull) {
  const holes = Array.isArray(blastFull?.holes) ? blastFull.holes : [];
  if (!blastFull || !holes.length) return 0;

  const rows = [...holes]
    .sort((a, b) => (a.holeNumber || 0) - (b.holeNumber || 0))
    .map((hole) =>
      Object.fromEntries(
        COLUMN_CONFIG.map(([label, getter]) => [
          label,
          getter(blastFull, hole),
        ]),
      ),
    );

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  worksheet["!cols"] = COLUMN_CONFIG.map(([label]) => ({
    wch: Math.max(label.length + 2, 16),
  }));

  XLSX.utils.book_append_sheet(workbook, worksheet, "Carga");
  XLSX.writeFile(workbook, buildFileName(blastFull));

  return rows.length;
}
