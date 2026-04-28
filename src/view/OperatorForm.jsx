import { useCallback, useEffect, useRef, useState } from "react";
import HoleLog from "../components/HoleLog";
import Toast, { showToast, useToast } from "../components/Toast";
import { holeRepository, shiftRepository } from "../di/container";
import { supabaseReady } from "../infrastructure/supabase/supabaseClient";
import { createClientId } from "../lib/ids";
import {
  clearAllRecords,
  clearOperatorSnapshot,
  deleteRecord,
  getPendingRecords,
  loadOperatorSnapshot,
  markRecordPending,
  markRecordSynced,
  saveOperatorSnapshot,
  saveRecord,
} from "../lib/offlineStore";
import ShiftHeader from "../components/ShiftHeader";
import HoleEntry from "../components/HoleEntry";

function buildSnapshot(shift, holes) {
  return { shift, holes, savedAt: Date.now() };
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

export default function OperatorForm() {
  const [shift, setShift] = useState(null);
  const [holes, setHoles] = useState([]);
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
        const pending = await getPendingRecords();
        if (!pending.length) {
          if (manual) showToast("Todo esta sincronizado");
          return;
        }

        const syncedShiftIds = new Set();
        const pendingShiftIds = new Set();
        const syncedHoleIds = new Set();
        const pendingHoleIds = new Set();
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

            const responseId = await shiftRepository.upsertShift(
              record.id,
              shiftData,
            );

            if (responseId === record.id) {
              await markRecordSynced(record.id);
              syncedShiftIds.add(record.id);
            } else {
              await markRecordPending(record.id, "Supabase no confirmo turno");
              pendingShiftIds.add(record.id);
            }
          }

          if (record.kind === "hole") {
            const holeData = { ...record.data, holeId: record.id };
            const shiftId = holeData.shiftId;
            const hasManualUpdate =
              holeData.updatedAt !== undefined && holeData.updatedAt !== null;
            delete holeData.synced;

            const responseId = hasManualUpdate
              ? await holeRepository.holeExists(record.id).then((exists) =>
                  exists
                    ? holeRepository.updateHole(
                        record.id,
                        {
                          depth: holeData.depth,
                          ceiling: holeData.ceiling,
                          floor: holeData.floor,
                        },
                        holeData.updatedBy || shift?.operatorName || "Operador",
                      )
                    : holeRepository.upsertHole(record.id, shiftId, holeData),
                )
              : await holeRepository.upsertHole(record.id, shiftId, holeData);

            if (responseId === record.id) {
              await markRecordSynced(record.id);
              syncedHoleIds.add(record.id);
            } else {
              await markRecordPending(
                record.id,
                "Supabase no confirmo barreno",
              );
              pendingHoleIds.add(record.id);
            }
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
            if (syncedShiftIds.has(prev.shiftId))
              return { ...prev, synced: true };
            if (pendingShiftIds.has(prev.shiftId))
              return { ...prev, synced: false };
            return prev;
          });
        }

        if (syncedHoleIds.size || pendingHoleIds.size) {
          setHoles((prev) =>
            prev.map((hole) =>
              syncedHoleIds.has(hole.holeId)
                ? { ...hole, synced: true }
                : pendingHoleIds.has(hole.holeId)
                  ? { ...hole, synced: false }
                  : hole,
            ),
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
    [holes, shift?.operatorName],
  );

  useEffect(() => {
    let active = true;

    loadOperatorSnapshot()
      .then((snapshot) => {
        if (!active || !snapshot) return;
        setShift(snapshot.shift || null);
        setHoles(Array.isArray(snapshot.holes) ? snapshot.holes : []);
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

    saveOperatorSnapshot(buildSnapshot(shift, holes)).catch(() => {
      // Offline save failed
    });
  }, [shift, holes, hydrated]);

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
  const nextHoleNumber = holes.length + 1;

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
      date: shift.date,
      shiftId: shift.shiftId,
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
        window.navigator.onLine &&
        supabaseReady
      ) {
        await holeRepository.deleteHole(holeId);
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
        "Resetear turno? Datos siguen guardados localmente y en Supabase cuando hay conexion.",
      )
    )
      return;
    setShift(null);
    setHoles([]);
    setHeaderKey((prev) => prev + 1);

    try {
      await clearOperatorSnapshot();
      await clearAllRecords();
    } catch {
      // Reset cleanup failed
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-surface-base)",
        paddingBottom: "5rem",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background:
            "color-mix(in srgb, var(--color-surface-1) 95%, transparent)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--color-border-subtle)",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "var(--color-text-muted)",
            }}
          >
            FOR-PO-04
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--color-border-strong)",
            }}
          >
            ·
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "var(--color-brand-amber)",
            }}
          >
            Perforacion
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.5625rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: !isOnline
                ? "var(--color-brand-amber)"
                : supabaseReady
                  ? "var(--color-brand-emerald)"
                  : "var(--color-text-faint)",
            }}
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
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: "0.625rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--color-text-muted)",
                transition: "color 0.15s",
                padding: "0.25rem",
              }}
              onMouseEnter={(event) =>
                (event.currentTarget.style.color = "var(--color-danger)")
              }
              onMouseLeave={(event) =>
                (event.currentTarget.style.color = "var(--color-text-muted)")
              }
            >
              Reset
            </button>
          )}
        </div>
      </header>

      <div style={{ paddingTop: "1rem" }}>
        <ShiftHeader
          key={headerKey}
          onFrozen={handleShiftFrozen}
          initialShift={shift}
        />

        {shift && (
          <>
            <HoleEntry
              nextHoleNumber={nextHoleNumber}
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
          </>
        )}
      </div>

      <Toast state={toastState} />
    </div>
  );
}
