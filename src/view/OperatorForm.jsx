import { useCallback, useEffect, useRef, useState } from "react";
import HoleLog from "../components/HoleLog";
import Toast, { showToast, useToast } from "../components/Toast";
import { holeRepository, operatorRepository } from "../di/container";
import { supabaseReady } from "../infrastructure/supabase/supabaseClient";
import { createClientId } from "../lib/ids";
import {
  clearLocalViewState,
  clearOperatorSnapshot,
  deleteRecord,
  getPendingRecordsByKinds,
  loadOperatorSnapshot,
  markRecordPending,
  markRecordSynced,
  saveOperatorSnapshot,
  saveRecord,
} from "../lib/offlineStore";
import ShiftHeader from "../components/ShiftHeader";
import HoleEntry from "../components/HoleEntry";

function buildSnapshot(shift, holes, blastHolesCatalog) {
  return { shift, holes, blastHolesCatalog, savedAt: Date.now() };
}

function isSyncedValue(value) {
  return value === true || value === 1 || value === "synced";
}

function createPendingRecord(id, kind, data) {
  return {
    id,
    kind,
    data: { ...data, synced: false },
    synced: 0,
    createdAt: data.createdAt || Date.now(),
  };
}

function buildOperatorPayload(shiftData) {
  return {
    name: shiftData.operatorName,
    shiftType: shiftData.shiftType,
    equipment: shiftData.equipment,
    date: shiftData.date,
    elevation:
      shiftData.elevation === "" || shiftData.elevation === undefined
        ? null
        : shiftData.elevation,
    pattern: shiftData.pattern || null,
    diameter:
      shiftData.diameter === "" || shiftData.diameter === undefined
        ? null
        : shiftData.diameter,
  };
}

function buildDrillingPayload(holeData, operatorId) {
  return {
    operatorId,
    depth: holeData.depth ?? null,
    ceiling: holeData.ceiling ?? null,
    floor: holeData.floor ?? null,
  };
}

export default function OperatorForm() {
  const [shift, setShift] = useState(null);
  const [holes, setHoles] = useState([]);
  const [blastHolesCatalog, setBlastHolesCatalog] = useState([]);
  const [loadingBlastHoles, setLoadingBlastHoles] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [headerKey, setHeaderKey] = useState(0);
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);
  const toastState = useToast();

  const syncPendingRecords = useCallback(
    async (manual = false) => {
      if (syncingRef.current) return;
      if (!window.navigator.onLine || !supabaseReady) {
        if (manual) showToast("Sin conexion para sincronizar");
        return;
      }

      syncingRef.current = true;
      setSyncing(true);

      try {
        const pending = await getPendingRecordsByKinds(["shift", "hole"]);
        if (!pending.length) {
          if (manual) showToast("Todo esta sincronizado");
          return;
        }

        const syncedShiftIds = new Set();
        const pendingShiftIds = new Set();
        const syncedHoleIds = new Set();
        const pendingHoleIds = new Set();
        const syncedShiftData = new Map();
        const syncedHoleData = new Map();
        let skippedShiftSync = false;

        for (const record of pending) {
          if (record.kind === "shift") {
            const hasHoles = holes.some((hole) => hole.shiftId === record.id);
            if (!hasHoles) {
              skippedShiftSync = true;
              continue;
            }

            const shiftData = { ...record.data, shiftId: record.id };
            delete shiftData.synced;

            const operatorId =
              shiftData.operatorId ||
              (await operatorRepository.create(
                buildOperatorPayload(shiftData),
              ));

            if (operatorId) {
              const nextShiftData = {
                ...shiftData,
                operatorId,
                synced: true,
              };

              await saveRecord({
                ...record,
                data: nextShiftData,
                synced: true,
              });
              await markRecordSynced(record.id);
              syncedShiftIds.add(record.id);
              syncedShiftData.set(record.id, nextShiftData);
            } else {
              await markRecordPending(record.id, "Supabase no confirmo turno");
              pendingShiftIds.add(record.id);
            }
          }

          if (record.kind === "hole") {
            const holeData = { ...record.data, holeId: record.id };
            delete holeData.synced;

            const baseShiftData =
              syncedShiftData.get(holeData.shiftId) ||
              (shift?.shiftId === holeData.shiftId ? shift : null);
            const operatorId = holeData.operatorId || baseShiftData?.operatorId;

            if (!operatorId || !holeData.holeId) {
              await markRecordPending(
                record.id,
                "Falta operador o barreno para sincronizar barreno",
              );
              pendingHoleIds.add(record.id);
              continue;
            }

            await holeRepository.upsertDrilling(
              holeData.holeId,
              buildDrillingPayload(holeData, operatorId),
              holeData.updatedBy || baseShiftData?.operatorName || "Operador",
            );

            const nextHoleData = {
              ...holeData,
              operatorId,
              synced: true,
            };

            await saveRecord({
              ...record,
              data: nextHoleData,
              synced: true,
            });
            await markRecordSynced(record.id);
            syncedHoleIds.add(record.id);
            syncedHoleData.set(record.id, nextHoleData);
          }
        }

        if (
          syncedShiftIds.size === 0 &&
          pendingShiftIds.size === 0 &&
          syncedHoleIds.size === 0 &&
          pendingHoleIds.size === 0 &&
          skippedShiftSync
        ) {
          if (manual) showToast("Crea primer barreno para sincronizar turno");
          return;
        }

        if (syncedShiftIds.size || pendingShiftIds.size) {
          setShift((prev) => {
            if (!prev) return prev;
            if (syncedShiftData.has(prev.shiftId)) {
              return syncedShiftData.get(prev.shiftId);
            }
            if (pendingShiftIds.has(prev.shiftId)) {
              return { ...prev, synced: false };
            }
            return prev;
          });
        }

        if (syncedHoleIds.size || pendingHoleIds.size) {
          setHoles((prev) =>
            prev.map((hole) => {
              if (syncedHoleData.has(hole.holeId)) {
                return syncedHoleData.get(hole.holeId);
              }
              if (pendingHoleIds.has(hole.holeId)) {
                return { ...hole, synced: false };
              }
              return hole;
            }),
          );
        }

        if (manual) {
          if (pendingShiftIds.size || pendingHoleIds.size) {
            const hasSuccess = syncedShiftIds.size || syncedHoleIds.size;
            showToast(
              hasSuccess
                ? "Sincronizacion parcial"
                : "Supabase no confirmo recepcion",
            );
          } else {
            showToast("Registros sincronizados");
          }
        }
      } catch {
        if (manual) {
          showToast("Fallo la sincronizacion");
        }
      } finally {
        syncingRef.current = false;
        setSyncing(false);
      }
    },
    [holes, shift],
  );

  useEffect(() => {
    let active = true;

    loadOperatorSnapshot()
      .then((snapshot) => {
        if (!active || !snapshot) return;
        setShift(snapshot.shift || null);
        setHoles(Array.isArray(snapshot.holes) ? snapshot.holes : []);
        setBlastHolesCatalog(
          Array.isArray(snapshot.blastHolesCatalog)
            ? snapshot.blastHolesCatalog
            : [],
        );
      })
      .catch(() => {
        // Offline restore failed
      })
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!shift && holes.length === 0) {
      clearOperatorSnapshot().catch(() => {
        // Offline clear failed
      });
      return;
    }

    saveOperatorSnapshot(buildSnapshot(shift, holes, blastHolesCatalog)).catch(
      () => {
        // Offline save failed
      },
    );
  }, [shift, holes, blastHolesCatalog, hydrated]);

  useEffect(() => {
    let active = true;

    async function loadBlastHoles() {
      if (!shift?.blastId) {
        setBlastHolesCatalog([]);
        return;
      }

      setLoadingBlastHoles(true);
      try {
        const data = await holeRepository.fetchHolesByBlast(shift.blastId);
        if (!active) return;
        setBlastHolesCatalog(data);
      } catch (error) {
        console.error("Error loading holes by blast:", error);
        if (active) {
          setBlastHolesCatalog([]);
        }
      } finally {
        if (active) {
          setLoadingBlastHoles(false);
        }
      }
    }

    loadBlastHoles();

    return () => {
      active = false;
    };
  }, [shift?.blastId]);

  const pendingSyncCount =
    (shift && !isSyncedValue(shift.synced) ? 1 : 0) +
    holes.filter((hole) => !isSyncedValue(hole.synced)).length;

  useEffect(() => {
    if (!hydrated || !isOnline || pendingSyncCount === 0) return;

    const timeoutId = window.setTimeout(() => {
      syncPendingRecords();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [hydrated, isOnline, pendingSyncCount, syncPendingRecords]);

  const totalMeters = holes.reduce((sum, hole) => sum + hole.depth, 0);
  const availableHoles = blastHolesCatalog.filter((hole) => {
    if (hole.drilling) {
      return false;
    }

    return !holes.some(
      (localHole) => (localHole.remoteHoleId || localHole.holeId) === hole.id,
    );
  });

  async function handleShiftFrozen(shiftData) {
    const localShift = {
      ...shiftData,
      synced: false,
      shiftId: shiftData.shiftId || createClientId(),
    };
    setShift(localShift);

    await saveRecord(
      createPendingRecord(localShift.shiftId, "shift", localShift),
    );
  }

  async function handleHoleSaved(hole) {
    if (!shift) return;

    const localHole = {
      ...hole,
      blastId: shift.blastId,
      date: shift.date,
      shiftId: shift.shiftId,
      operatorId: shift.operatorId || null,
      remoteHoleId: hole.holeId,
      synced: false,
    };
    setHoles((prev) => [...prev, localHole]);

    await saveRecord(createPendingRecord(localHole.holeId, "hole", localHole));
  }

  async function handleHoleDelete(holeId) {
    const targetHole = holes.find((hole) => hole.holeId === holeId);
    setHoles((prev) => prev.filter((hole) => hole.holeId !== holeId));

    try {
      await deleteRecord(holeId);
      if (
        isSyncedValue(targetHole?.synced) &&
        (targetHole?.remoteHoleId || targetHole?.holeId) &&
        window.navigator.onLine &&
        supabaseReady
      ) {
        await holeRepository.deleteDrilling(
          targetHole.remoteHoleId || targetHole.holeId,
        );
      }
    } catch {
      // Delete failed
    }
  }

  async function handleHoleEdit(holeId, patch) {
    const targetHole = holes.find((hole) => hole.holeId === holeId);
    if (!targetHole || !shift) return;

    const nextHole = {
      ...targetHole,
      ...patch,
      updatedAt: Date.now(),
      updatedBy: shift.operatorName || "Operador",
      synced: false,
    };

    setHoles((prev) =>
      prev.map((hole) => (hole.holeId === holeId ? nextHole : hole)),
    );
    await saveRecord(createPendingRecord(nextHole.holeId, "hole", nextHole));
  }

  async function handleReset() {
    if (
      holes.length &&
      !window.confirm(
        "Verifica que tus cambios estén sincronizados. Esta accion no se puede deshacer.",
      )
    )
      return;
    setShift(null);
    setHoles([]);
    setHeaderKey((prev) => prev + 1);

    try {
      await clearLocalViewState("perforacion");
      showToast("Perforacion reseteada");
    } catch {
      showToast("Error al resetear perforacion");
    }
  }

  return (
    <div className="min-h-screen bg-(--color-surface-base) pb-20">
      <header className="sticky top-0 z-10 backdrop-blur-md border-b border-(--color-border-subtle) py-3 px-4 flex items-center justify-between bg-(--color-surface-1)/95">
        <div className="flex items-center gap-2">
          <span className="font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.18em] text-(--color-text-muted)">
            FOR-PO-04
          </span>
          <span className="font-(--font-mono) text-(--color-border-strong)">
            ·
          </span>
          <span className="font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.18em] text-(--color-brand-amber)">
            Perforacion
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`font-(--font-mono) text-[0.5625rem] uppercase tracking-widest ${!isOnline ? "text-(--color-brand-amber)" : supabaseReady ? "text-(--color-brand-emerald)" : "text-(--color-text-faint)"}`}
          >
            {!isOnline
              ? "○ Offline listo"
              : supabaseReady
                ? "● Online"
                : "○ Offline"}
          </span>

          {shift && (
            <button
              onClick={handleReset}
              className="bg-transparent border-none cursor-pointer font-(--font-mono) text-[0.625rem] uppercase tracking-widest text-(--color-text-muted) transition-colors p-1 hover:text-(--color-danger)  "
            >
              Reset
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-col items-stretch gap-2 overflow-x-hidden px-2 py-2 sm:px-4 md:px-6 [&_.section-card]:mx-0 [&_.section-card]:w-full [&_.section-card]:min-w-0">
        <div className="w-full">
          <ShiftHeader
            key={headerKey}
            onFrozen={handleShiftFrozen}
            initialShift={shift}
          />
        </div>

        {shift && (
          <div className="w-full">
            <HoleEntry
              availableHoles={availableHoles}
              loadingHoles={loadingBlastHoles}
              onSaved={handleHoleSaved}
            />
            <HoleLog
              holes={holes}
              totalMeters={totalMeters}
              onDelete={handleHoleDelete}
              onEdit={handleHoleEdit}
              operatorName={shift.operatorName}
              onForceSync={() => syncPendingRecords(true)}
              syncDisabled={
                pendingSyncCount === 0 || !isOnline || !supabaseReady
              }
              syncing={syncing}
            />
          </div>
        )}
      </div>

      <Toast state={toastState} />
    </div>
  );
}
