import * as XLSX from "xlsx";
import { formatDateTime, formatTime, getDateKey } from "./datetime";

const EMPTY = "";

const COLUMN_CONFIG = [
  ["Fecha", (row) => (row.createdAt ? getDateKey(row.createdAt) : EMPTY)],
  ["Turno", (row) => row.shift || EMPTY],
  ["Operador", (row) => row.operatorName || EMPTY],
  ["Equipo", (row) => row.equipment || EMPTY],
  ["voladura", (row) => row.blastCode || EMPTY],
  ["Patron", (row) => row.pattern || EMPTY],
  ["Diametro", (row) => formatNumber(row.diameter)],
  ["Cota (m)", (row) => formatNumber(row.elevation)],
  ["Prof. planificada (m)", (row) => formatNumber(row.plannedDepth)],
  ["# Barreno", (row) => row.holeNumber ?? EMPTY],
  ["Profundidad (m)", (row) => formatNumber(row.depth)],
  ["Techo (m)", (row) => formatNumber(row.ceiling)],
  ["Piso (m)", (row) => formatNumber(row.floor)],
  ["Hora", (row) => (row.createdAt ? formatTime(row.createdAt) : EMPTY)],
  ["Actualizado por", (row) => row.updatedBy || EMPTY],
  ["Actualizado en", (row) => formatDateTime(row.updatedAt)],
  ["ID barreno", (row) => row.holeId || EMPTY],
];

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return EMPTY;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return numeric;
}

export function exportRowsToXlsx(rows = [], selectedDate) {
  const exportRows = rows
    .filter((row) => row.createdAt && getDateKey(row.createdAt) === selectedDate)
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
      COLUMN_CONFIG.map(([label, getter]) => [label, getter(row)]),
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
