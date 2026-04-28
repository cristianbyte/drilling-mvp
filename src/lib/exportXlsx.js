import * as XLSX from "xlsx";
import {
  formatDateOnly,
  formatDateTime,
  formatTime,
  getBrowserTimeZone,
  getDateKey,
} from "./datetime";

const EMPTY = "";

const COLUMN_CONFIG = [
  ["Fecha", (row, timeZone) => row.date || getDateKey(row.createdAt, timeZone)],
  ["Turno", (row) => row.shift || EMPTY],
  ["Operador", (row) => row.operatorName || EMPTY],
  ["Equipo", (row) => row.equipment || EMPTY],
  ["Ubicacion", (row) => row.location || EMPTY],
  ["# Voladura", (row) => row.blastId || EMPTY],
  ["Patron", (row) => row.pattern || EMPTY],
  ["Diametro", (row) => formatNumber(row.diameter)],
  ["Cota (m)", (row) => formatNumber(row.elevation)],
  ["# Hoyo", (row) => row.holeNumber ?? EMPTY],
  ["Profundidad (m)", (row) => formatNumber(row.depth)],
  ["Techo (m)", (row) => formatNumber(row.ceiling)],
  ["Piso (m)", (row) => formatNumber(row.floor)],
  [
    "Fecha registro",
    (row, timeZone) => formatDateTime(row.createdAt, timeZone),
  ],
  ["Actualizado por", (row) => row.updatedBy || EMPTY],
  [
    "Actualizado en",
    (row, timeZone) => formatDateTime(row.updatedAt, timeZone),
  ],
  ["ID turno", (row) => row.shiftId || EMPTY],
  ["ID hoyo", (row) => row.holeId || EMPTY],
];

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return EMPTY;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return numeric;
}

export function exportRowsToXlsx(
  rows = [],
  selectedDate,
  timeZone = getBrowserTimeZone(),
) {
  const exportRows = rows
    .filter(
      (row) =>
        getDateKey(row.createdAt, timeZone) === selectedDate ||
        row.date === selectedDate,
    )
    .sort((a, b) => {
      const shiftCompare = (a.shift || "").localeCompare(b.shift || "");
      if (shiftCompare !== 0) return shiftCompare;

      const operatorCompare = (a.operatorName || "").localeCompare(
        b.operatorName || "",
      );
      if (operatorCompare !== 0) return operatorCompare;

      return (a.holeNumber || 0) - (b.holeNumber || 0);
    });

  if (!exportRows.length) return 0;

  const data = exportRows.map((row) =>
    Object.fromEntries(
      COLUMN_CONFIG.map(([label, getter]) => [label, getter(row, timeZone)]),
    ),
  );

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  worksheet["!cols"] = COLUMN_CONFIG.map(([label]) => ({
    wch: Math.max(label.length + 2, 14),
  }));

  XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
  XLSX.writeFile(workbook, `perforacion-${selectedDate}.xlsx`);

  return exportRows.length;
}
