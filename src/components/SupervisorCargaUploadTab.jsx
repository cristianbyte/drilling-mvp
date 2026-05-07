import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { blastRepository, holeRepository } from "../di/container";

const COLUMN_CONFIG = [
  { key: "holeNumber", label: "No. Pozo", column: "A" },
  { key: "depth", label: "Profundidad", column: "B" },
  { key: "emulsion", label: "Emulsion Total Diseño", column: "C" },
  { key: "stemmingInitial", label: "Retacado Inicial (m)", column: "D" },
  { key: "stemmingFinal", label: "Retacado Final Diseño", column: "E" },
];

function getCellValue(sheet, address) {
  const value = sheet[address]?.v;
  return value === undefined || value === null ? "" : String(value).trim();
}

function readColumnValues(sheet, column) {
  const values = [];
  let lastFilledIndex = -1;

  for (let row = 2; row <= 5000; row += 1) {
    const value = getCellValue(sheet, `${column}${row}`);
    values.push(value);
    if (value) lastFilledIndex = values.length - 1;
  }

  return values.slice(0, lastFilledIndex + 1);
}

function buildInitialState() {
  return {
    fileName: "",
    location: "Pendiente de lectura",
    blast: "Pendiente de lectura",
    columns: Object.fromEntries(
      COLUMN_CONFIG.map(({ key }) => [key, "Pendiente de lectura"]),
    ),
    status: "Esperando archivo .xlsx",
    error: "",
    totalCells: 0,
    canLoad: false,
    imported: false,
    busy: false,
    progress: 0,
    rows: [],
  };
}

function toNumber(value, label) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    throw new Error(`Valor invalido en ${label}.`);
  }
  return numeric;
}

function FieldCard({ label, value, ready = false }) {
  return (
    <div className={`w-full flex flex-row boder-none`}>
      <div
        className={`w-full font-mono text-sm uppercase tracking-[0.08em] text-(--color-text-muted)`}
      >
        {label}
      </div>
      <div
        className={`font-mono text-xs w-full ${
          ready ? "text-(--color-brand-emerald)" : "text-(--color-text-muted)"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function SupervisorCargaUploadTab() {
  const [state, setState] = useState(buildInitialState);
  const fileInputRef = useRef(null);

  function setLoadingStep(progress, status) {
    setState((current) => ({
      ...current,
      progress,
      status,
    }));
  }

  async function handleFileChange(file) {
    if (!file) {
      setState(buildInitialState());
      return;
    }

    setState({
      ...buildInitialState(),
      fileName: file.name,
      busy: true,
      status: `Analizando: ${file.name}`,
    });

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        throw new Error("No se encontro una hoja valida en el archivo.");
      }

      const location = getCellValue(sheet, "F2").toUpperCase();
      const blast = getCellValue(sheet, "G2");
      if (!location || !blast) {
        throw new Error("Faltan los datos base de Ubicacion o Voladura.");
      }

      const columns = COLUMN_CONFIG.map((config) => ({
        ...config,
        values: readColumnValues(sheet, config.column),
      }));
      const lengths = columns.map(({ values }) => values.length);
      const validColumns = columns.every(
        ({ values }) => values.length > 0 && values.every(Boolean),
      );
      const sameLength = lengths.every((length) => length === lengths[0]);

      if (!validColumns) {
        throw new Error(
          "Hay columnas vacias o celdas faltantes dentro del bloque de datos.",
        );
      }

      if (!sameLength) {
        throw new Error("Las 5 columnas no tienen la misma longitud.");
      }

      const rows = columns[0].values.map((_, index) => ({
        holeNumber: toNumber(columns[0].values[index], "No. Pozo"),
        plannedDepth: toNumber(columns[1].values[index], "Profundidad"),
        plannedEmulsion: toNumber(
          columns[2].values[index],
          "Emulsion Total Diseño",
        ),
        plannedStemmingInitial: toNumber(
          columns[3].values[index],
          "Retacado Inicial (m)",
        ),
        plannedStemmingFinal: toNumber(
          columns[4].values[index],
          "Retacado Final Diseño",
        ),
      }));

      if (new Set(rows.map((row) => row.holeNumber)).size !== rows.length) {
        throw new Error("Hay pozos duplicados en el archivo.");
      }

      setState({
        fileName: file.name,
        location,
        blast,
        columns: Object.fromEntries(
          columns.map(({ key, column, values }) => [
            key,
            `${column}2:${column}${values.length + 1} | ${values.length} filas`,
          ]),
        ),
        status: `Se cargaron correctamente ${lengths[0] * columns.length} celdas.`,
        error: "",
        totalCells: lengths[0] * columns.length,
        canLoad: true,
        imported: false,
        busy: false,
        progress: 0,
        rows,
      });
    } catch (error) {
      console.error("Error reading supervisor carga Excel:", error);
      setState({
        ...buildInitialState(),
        fileName: file.name,
        busy: false,
        status: "Archivo con errores de validacion",
        error:
          error instanceof Error
            ? error.message
            : "No se pudo leer el archivo.",
      });
    }
  }

  async function handleAction() {
    if (state.imported || state.busy) return;

    if (!state.canLoad) {
      fileInputRef.current?.click();
      return;
    }

    setState((current) => ({
      ...current,
      status: "Enviando datos...",
      error: "",
      busy: true,
      canLoad: false,
      progress: 0,
    }));

    try {
      const blastId = await blastRepository.findOrCreateBlast({
        blastCode: state.blast,
        location: state.location,
      });

      if (!blastId) {
        throw new Error("No se pudo resolver la voladura.");
      }

      setLoadingStep(25, "Voladura resuelta.");

      await holeRepository.upsertHoles(
        blastId,
        state.rows.map((row) => row.holeNumber),
      );

      setLoadingStep(50, "Barrenos resueltos.");

      const holes = await holeRepository.fetchHolesByBlast(blastId);

      if (holes.length < state.rows.length) {
        throw new Error("No se pudieron resolver todos los barrenos.");
      }

      const holeIdByNumber = new Map(
        holes.map((hole) => [hole.holeNumber, hole.id]),
      );

      const loadingRows = state.rows.map((row) => {
        const holeId = holeIdByNumber.get(row.holeNumber);

        if (!holeId) {
          throw new Error(
            `No se pudo relacionar el barreno ${row.holeNumber} con la voladura.`,
          );
        }

        return {
          holeId,
          plannedDepth: row.plannedDepth,
          plannedEmulsion: row.plannedEmulsion,
          plannedStemmingInitial: row.plannedStemmingInitial,
          plannedStemmingFinal: row.plannedStemmingFinal,
        };
      });

      setLoadingStep(75, "Datos relacionados. Enviando plan de carga...");

      await holeRepository.upsertLoadingPlan(loadingRows, "SUPERVISOR EXCEL");

      setState((current) => ({
        ...current,
        progress: 100,
        status: `Carga confirmada: ${current.totalCells} datos.`,
        imported: true,
        busy: false,
        canLoad: false,
      }));
    } catch (error) {
      console.error("Error importing supervisor carga Excel:", error);
      setState((current) => ({
        ...current,
        status: "Error de carga",
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el archivo.",
        busy: false,
        canLoad: true,
      }));
    }
  }

  const fields = [
    ["Voladura", state.blast],
    ["Ubicacion", state.location],
    ...COLUMN_CONFIG.map(({ key, label }) => [label, state.columns[key]]),
  ];
  const hasError = Boolean(state.error);
  const hasData = state.canLoad;
  const isUploading = state.busy && state.progress > 0;
  const actionLabel = state.imported
    ? "Cargado"
    : state.canLoad
      ? "Cargar datos"
      : "Subir archivo";

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="rounded-(--radius-card) border border-dashed border-(--color-border-default) bg-(--color-surface-base) p-4">
          <div className="flex flex-wrap items-center gap-3 sm:justify-between">
            <div
              className={`rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.08em] ${
                hasError
                  ? "border-(--color-danger) bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-(--color-danger)"
                  : hasData
                    ? "border-(--color-brand-emerald) bg-(--color-brand-emerald-dim) text-(--color-brand-emerald)"
                    : "border-(--color-border-subtle) bg-(--color-surface-1) text-(--color-text-faint)"
              }`}
            >
              {hasError ? "Error" : hasData ? "Listo" : "Pendiente"}
            </div>
            <div className="flex-1 rounded-(--radius-card) border border-(--color-border-subtle) bg-(--color-surface-1) px-3 py-2.5 font-mono text-[0.72rem] uppercase tracking-[0.08em] text-(--color-text-faint)">
              {state.status}
            </div>
          </div>
          {state.error ? (
            <div className="mt-3 rounded-(--radius-card) border border-(--color-danger) bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] px-3 py-2.5 font-mono text-[0.72rem] text-(--color-danger)">
              {state.error}
            </div>
          ) : null}
          {isUploading ? (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between font-mono text-[0.68rem] uppercase tracking-[0.08em] text-(--color-text-faint)">
                <span>Progreso</span>
                <span>{state.progress}%</span>
              </div>
              <div className="h-5 overflow-hidden rounded-full border border-(--color-border-subtle) bg-(--color-surface-1)">
                <div
                  className="progress-stripes h-full transition-all duration-300"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
            </div>
          ) : null}
          {state.imported ? (
            <div className="mt-3 rounded-(--radius-card) border border-(--color-brand-emerald) bg-(--color-brand-emerald-dim) px-3 py-2.5 font-mono text-[0.72rem] text-(--color-brand-emerald)">
              Carga completada.
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 border-(--color-border-subtle) items-center justify-center">
          <button
            type="button"
            className="btn-primary"
            onClick={handleAction}
            disabled={state.imported || state.busy}
          >
            {actionLabel}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(event) =>
              handleFileChange(event.target.files?.[0] ?? null)
            }
          />

          <div className="w-full font-mono text-[0.72rem] uppercase tracking-[0.08em] text-(--color-text-faint)">
            {state.fileName || "Sin archivo"}
          </div>
        </div>

        <div className="rounded-(--radius-card) border border-(--color-border-subtle) bg-(--color-surface-base) p-4">
          <div className="flex flex-wrap gap-3">
            {fields.map(([label, value]) => (
              <FieldCard
                key={label}
                label={label}
                value={value}
                ready={state.canLoad}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
