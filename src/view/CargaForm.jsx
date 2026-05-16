import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CargaHolesSection from "../components/features/carga/CargaHolesSection";
import CargaLeaderSection from "../components/features/carga/CargaLeaderSection";
import CargaAccessoryUsageModal from "../components/modals/carga/CargaAccessoryUsageModal";
import DensityControlModal from "../components/modals/carga/DensityControlModal";
import LoadHoleModal from "../components/modals/carga/LoadHoleModal";
import Toast, { showToast, useToast } from "../components/ui/Toast";
import {
  accessoryUsageRepository,
  blastRepository,
  holeRepository,
} from "../di/container";
import { supabaseReady } from "../infrastructure/supabase/supabaseClient";
import { createClientId } from "../lib/ids";
import {
  buildDensityDraft,
  buildDensityPayload,
  hasDensityData,
} from "../lib/densityControl";
import {
  clearLocalViewState,
  clearCargaSnapshot,
  deleteRecord,
  getPendingRecordsByKinds,
  loadCargaAccessoryHistory,
  loadCargaSnapshot,
  markRecordPending,
  markRecordSynced,
  saveCargaAccessoryHistory,
  saveCargaSnapshot,
  saveRecord,
} from "../lib/offlineStore";
import { usePageTitle } from "../hooks/usePageTitle";

function buildAccessoryUsageFormState(record) {
  return {
    id: record?.id || null,
    usageDate: record?.usageDate || new Date().toISOString().slice(0, 10),
    ikon15m: record?.ikon15m ? String(record.ikon15m) : "",
    p337: record?.p337 ? String(record.p337) : "",
    notes: record?.notes || "",
  };
}

function parseAccessoryQty(value) {
  if (value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeAccessoryNumberInput(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 2);
}

function buildAccessoryPendingRecord(id, kind, data) {
  return {
    id,
    kind,
    data: { ...data, synced: false },
    synced: 0,
    createdAt: Date.now(),
  };
}

function buildLocalAccessoryId() {
  return `local-accessory:${Date.now()}`;
}

function isLocalAccessoryId(id) {
  return String(id || "").startsWith("local-accessory:");
}

function buildAccessoryPayload(form) {
  return {
    usageDate: form.usageDate,
    ikon15m: parseAccessoryQty(form.ikon15m),
    p337: parseAccessoryQty(form.p337),
    notes: form.notes.trim() || null,
  };
}

function sortAccessoryUsageRecords(records) {
  return [...records].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt || 0) -
      new Date(a.updatedAt || a.createdAt || 0),
  );
}

function mergeAccessoryUsageRecords(remoteRecords, pendingRecords) {
  const merged = new Map(remoteRecords.map((record) => [record.id, record]));
  const localCreates = [];

  for (const pending of pendingRecords) {
    if (pending.kind === "carga-accessory-create") {
      localCreates.push({ ...pending.data, synced: false });
      continue;
    }

    if (pending.kind === "carga-accessory-update") {
      const current = merged.get(pending.data.id) || pending.data;
      merged.set(pending.data.id, { ...current, ...pending.data, synced: false });
      continue;
    }

    if (pending.kind === "carga-accessory-delete") {
      merged.delete(pending.data.id);
    }
  }

  return sortAccessoryUsageRecords([...localCreates, ...merged.values()]);
}

function isAccessoryPendingKind(kind) {
  return (
    kind === "carga-accessory-create" ||
    kind === "carga-accessory-update" ||
    kind === "carga-accessory-delete"
  );
}

function filterAccessoryPendingRecordsByBlast(records, blastId) {
  if (!blastId) return [];

  return records.filter(
    (record) =>
      isAccessoryPendingKind(record.kind) && record.data?.blastId === blastId,
  );
}

function buildStartedContext(leader, blast) {
  if (!leader || !blast) return null;

  return {
    contextId: createClientId(),
    leaderId: leader.id,
    leaderName: leader.name,
    blastId: blast.id,
    blastCode: blast.blastCode,
    location: blast.location,
    synced: false,
  };
}

function buildLoadingDraft(loading) {
  return {
    plannedDepth: loading?.plannedDepth ?? null,
    plannedEmulsion: loading?.plannedEmulsion ?? null,
    plannedStemmingInitial: loading?.plannedStemmingInitial ?? null,
    plannedStemmingFinal: loading?.plannedStemmingFinal ?? null,
    leveling: loading?.leveling ?? null,
    deck: loading?.deck ?? null,
    emulsionTotal: loading?.emulsionTotal ?? null,
    stemmingFinal: loading?.stemmingFinal ?? null,
    synced: true,
  };
}

function hasDraftData(draft) {
  return [
    draft.leveling,
    draft.deck,
    draft.emulsionTotal,
    draft.stemmingFinal,
  ].some((value) => value !== null && value !== "");
}

function isSyncedValue(value) {
  return value === true || value === 1 || value === "synced";
}

function buildSnapshot({
  leaderId,
  blastId,
  startedContext,
  blastHoles,
  densityDraft,
  holeDrafts,
}) {
  return {
    leaderId,
    blastId,
    startedContext,
    blastHoles,
    densityDraft,
    holeDrafts,
    savedAt: Date.now(),
  };
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

function buildLoadingPayload(draft, leaderId) {
  return {
    leaderId,
    leveling: draft.leveling ?? null,
    deck: draft.deck ?? null,
    emulsionTotal: draft.emulsionTotal ?? null,
    stemmingFinal: draft.stemmingFinal ?? null,
  };
}

export default function CargaForm() {
  const [leaders, setLeaders] = useState([]);
  const [blasts, setBlasts] = useState([]);
  const [leaderId, setLeaderId] = useState("");
  const [blastId, setBlastId] = useState("");
  const [holeFilter, setHoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [startingTurn, setStartingTurn] = useState(false);
  const [startedContext, setStartedContext] = useState(null);
  const [blastHoles, setBlastHoles] = useState([]);
  const [densityDraft, setDensityDraft] = useState(null);
  const [holeDrafts, setHoleDrafts] = useState({});
  const [activeHoleId, setActiveHoleId] = useState(null);
  const [accessoryUsageModalOpen, setAccessoryUsageModalOpen] = useState(false);
  const [accessoryUsageForm, setAccessoryUsageForm] = useState(() =>
    buildAccessoryUsageFormState(),
  );
  const [accessoryUsageRecords, setAccessoryUsageRecords] = useState([]);
  const [accessoryUsageSyncing, setAccessoryUsageSyncing] = useState(false);
  const [accessoryHasPending, setAccessoryHasPending] = useState(false);
  const [densityModalOpen, setDensityModalOpen] = useState(false);
  const syncingRef = useRef(false);
  const accessorySyncingRef = useRef(false);
  const toastState = useToast();

  usePageTitle("Carga");
  const selectedLeader = useMemo(
    () => leaders.find((leader) => leader.id === leaderId) ?? null,
    [leaderId, leaders],
  );

  const selectedBlast = useMemo(
    () => blasts.find((blast) => blast.id === blastId) ?? null,
    [blastId, blasts],
  );

  const activeHole = useMemo(
    () => blastHoles.find((hole) => hole.id === activeHoleId) ?? null,
    [activeHoleId, blastHoles],
  );

  const activeDraft = useMemo(() => {
    if (!activeHole) return null;
    return holeDrafts[activeHole.id] ?? buildLoadingDraft(activeHole.loading);
  }, [activeHole, holeDrafts]);

  const filteredBlastHoles = useMemo(() => {
    const normalizedFilter = holeFilter.trim();
    if (!normalizedFilter) return blastHoles;

    return blastHoles.filter((hole) => {
      const holeNumber = String(hole.holeNumber ?? "");
      const formattedHoleNumber = holeNumber.padStart(2, "0");

      return (
        holeNumber.includes(normalizedFilter) ||
        formattedHoleNumber.includes(normalizedFilter)
      );
    });
  }, [blastHoles, holeFilter]);

  const cargaBodyHeightClass = startedContext
    ? "lg:max-h-[calc(100vh-15rem)]"
    : "";

  const isAccessoryEditing = Boolean(accessoryUsageForm.id);
  const accessorySyncStatus = useMemo(() => {
    if (accessoryUsageSyncing) return "syncing";
    return accessoryHasPending ||
      accessoryUsageRecords.some((record) => !isSyncedValue(record.synced))
      ? "pending"
      : "synced";
  }, [accessoryHasPending, accessoryUsageRecords, accessoryUsageSyncing]);

  const loadAccessoryPendingRecords = useCallback(async (blastId) => {
    const pending = await getPendingRecordsByKinds([
      "carga-accessory-create",
      "carga-accessory-update",
      "carga-accessory-delete",
    ]);

    return filterAccessoryPendingRecordsByBlast(pending, blastId);
  }, []);

  const persistAccessoryUsageRecords = useCallback(async (blastId, records) => {
    const nextRecords = sortAccessoryUsageRecords(records);
    setAccessoryUsageRecords(nextRecords);

    try {
      await saveCargaAccessoryHistory(blastId, nextRecords);
    } catch {
      // Offline cache save failed
    }

    return nextRecords;
  }, []);

  const loadAccessoryUsageRecords = useCallback(async () => {
    if (!startedContext?.blastId) {
      setAccessoryHasPending(false);
      setAccessoryUsageRecords([]);
      return;
    }

    try {
      const blastId = startedContext.blastId;
      const [cachedRecords, pending] = await Promise.all([
        loadCargaAccessoryHistory(blastId),
        loadAccessoryPendingRecords(blastId),
      ]);
      setAccessoryHasPending(pending.length > 0);

      if (!window.navigator.onLine || !supabaseReady) {
        await persistAccessoryUsageRecords(
          blastId,
          mergeAccessoryUsageRecords(cachedRecords, pending),
        );
        return;
      }

      const remoteRecords = await accessoryUsageRepository.listByBlastId(blastId);
      await persistAccessoryUsageRecords(
        blastId,
        mergeAccessoryUsageRecords(remoteRecords, pending),
      );
    } catch (error) {
      console.error("Error loading accessory usage:", error);

      if (startedContext?.blastId) {
        try {
          const [cachedRecords, pending] = await Promise.all([
            loadCargaAccessoryHistory(startedContext.blastId),
            loadAccessoryPendingRecords(startedContext.blastId),
          ]);
          setAccessoryHasPending(pending.length > 0);

          await persistAccessoryUsageRecords(
            startedContext.blastId,
            mergeAccessoryUsageRecords(cachedRecords, pending),
          );
        } catch {
          // Offline fallback restore failed
        }
      }
    }
  }, [loadAccessoryPendingRecords, persistAccessoryUsageRecords, startedContext?.blastId]);

  useEffect(() => {
    let mounted = true;

    loadCargaSnapshot()
      .then((snapshot) => {
        if (!mounted || !snapshot) return;
        setLeaderId(snapshot.leaderId || "");
        setBlastId(snapshot.blastId || "");
        setStartedContext(snapshot.startedContext || null);
        setBlastHoles(
          Array.isArray(snapshot.blastHoles) ? snapshot.blastHoles : [],
        );
        setDensityDraft(snapshot.densityDraft || null);
        setHoleDrafts(snapshot.holeDrafts || {});
      })
      .catch(() => {
        // Offline restore failed
      })
      .finally(() => {
        if (mounted) setHydrated(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    blastRepository
      .fetchCargaHeaderData()
      .then((data) => {
        if (!mounted) return;
        setLeaders(data.leaders ?? []);
        setBlasts(data.blasts ?? []);
      })
      .catch((error) => {
        console.error("Error loading carga header data:", error);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
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
    const timeoutId = window.setTimeout(() => {
      loadAccessoryUsageRecords();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAccessoryUsageRecords, startedContext?.blastId]);

  useEffect(() => {
    if (!hydrated) return;

    if (!leaderId && !blastId && !startedContext && blastHoles.length === 0) {
      clearCargaSnapshot().catch(() => {
        // Offline clear failed
      });
      return;
    }

    saveCargaSnapshot(
      buildSnapshot({
        leaderId,
        blastId,
        startedContext,
        blastHoles,
        densityDraft,
        holeDrafts,
      }),
    ).catch(() => {
      // Offline save failed
    });
  }, [
    blastHoles,
    blastId,
    densityDraft,
    holeDrafts,
    hydrated,
    leaderId,
    startedContext,
  ]);

  const pendingSyncCount =
    (startedContext && !isSyncedValue(startedContext.synced) ? 1 : 0) +
    (densityDraft && !isSyncedValue(densityDraft.synced) ? 1 : 0) +
    Object.values(holeDrafts).filter((draft) => !isSyncedValue(draft?.synced))
      .length;

  const syncPendingRecords = useCallback(async () => {
    if (syncingRef.current) return;
    if (!window.navigator.onLine || !supabaseReady) return;

    syncingRef.current = true;
    setSyncing(true);

    try {
      const pending = await getPendingRecordsByKinds([
        "carga-context",
        "carga-density",
        "carga-hole",
      ]);
      if (!pending.length) return;

      const syncedContextIds = new Set();
      const pendingContextIds = new Set();
      const syncedDensityContextIds = new Set();
      const pendingDensityContextIds = new Set();
      const syncedHoleIds = new Set();
      const pendingHoleIds = new Set();
      const syncedContexts = new Map();

      for (const record of pending) {
        if (record.kind === "carga-context") {
          const contextData = { ...record.data };
          delete contextData.synced;

          if (!contextData.leaderId || !contextData.blastId) {
            await markRecordPending(
              record.id,
              "Faltan referencias de lider o voladura",
            );
            pendingContextIds.add(record.id);
            continue;
          }

          const nextContext = {
            ...contextData,
            synced: true,
          };

          await saveRecord({
            ...record,
            data: nextContext,
            synced: true,
          });
          await markRecordSynced(record.id);
          syncedContextIds.add(record.id);
          syncedContexts.set(record.id, nextContext);
        }

        if (record.kind === "carga-density") {
          const densityData = { ...record.data };
          delete densityData.synced;

          const baseContext =
            syncedContexts.get(densityData.contextId) ||
            (startedContext?.contextId === densityData.contextId
              ? startedContext
              : null);

          if (!densityData.blastId) {
            await markRecordPending(
              record.id,
              "Falta voladura para sincronizar control de densidad",
            );
            pendingDensityContextIds.add(densityData.contextId);
            continue;
          }

          const updatedBy =
            densityData.updatedBy ||
            baseContext?.leaderName ||
            densityData.leaderName ||
            "Lider";

          await blastRepository.upsertDensity(
            densityData.blastId,
            buildDensityPayload(densityData),
            updatedBy,
          );

          const nextDensityData = {
            ...densityData,
            updatedBy,
            synced: true,
          };

          await saveRecord({
            ...record,
            data: nextDensityData,
            synced: true,
          });
          await markRecordSynced(record.id);
          syncedDensityContextIds.add(densityData.contextId);
        }

        if (record.kind === "carga-hole") {
          const holeData = { ...record.data };
          delete holeData.synced;

          const baseContext =
            syncedContexts.get(holeData.contextId) ||
            (startedContext?.contextId === holeData.contextId
              ? startedContext
              : null);

          const nextLeaderId = holeData.leaderId || baseContext?.leaderId;
          if (!holeData.holeId || !nextLeaderId) {
            await markRecordPending(
              record.id,
              "Falta lider o barreno para sincronizar carga",
            );
            pendingHoleIds.add(holeData.holeId);
            continue;
          }

          await holeRepository.upsertLoading(
            holeData.holeId,
            buildLoadingPayload(holeData, nextLeaderId),
            holeData.updatedBy || baseContext?.leaderName || "Lider",
          );

          const nextHoleData = {
            ...holeData,
            leaderId: nextLeaderId,
            synced: true,
          };

          await saveRecord({
            ...record,
            data: nextHoleData,
            synced: true,
          });
          await markRecordSynced(record.id);
          syncedHoleIds.add(holeData.holeId);
        }
      }

      if (syncedContextIds.size || pendingContextIds.size) {
        setStartedContext((prev) => {
          if (!prev) return prev;
          if (syncedContexts.has(prev.contextId)) {
            return syncedContexts.get(prev.contextId);
          }
          if (pendingContextIds.has(prev.contextId)) {
            return { ...prev, synced: false };
          }
          return prev;
        });
      }

      if (syncedDensityContextIds.size || pendingDensityContextIds.size) {
        setDensityDraft((prev) => {
          if (!prev || !startedContext?.contextId) return prev;
          if (syncedDensityContextIds.has(startedContext.contextId)) {
            return { ...prev, synced: true };
          }
          if (pendingDensityContextIds.has(startedContext.contextId)) {
            return { ...prev, synced: false };
          }
          return prev;
        });
      }

      if (syncedHoleIds.size || pendingHoleIds.size) {
        setHoleDrafts((current) =>
          Object.fromEntries(
            Object.entries(current).map(([holeKey, draft]) => [
              holeKey,
              syncedHoleIds.has(holeKey)
                ? { ...draft, synced: true }
                : pendingHoleIds.has(holeKey)
                  ? { ...draft, synced: false }
                  : draft,
            ]),
          ),
        );
      }
    } catch (error) {
      console.error("Error syncing carga records:", error);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [startedContext]);

  const syncAccessoryPendingRecords = useCallback(async () => {
    if (accessorySyncingRef.current) return;
    if (!window.navigator.onLine || !supabaseReady) return;

    accessorySyncingRef.current = true;
    setAccessoryUsageSyncing(true);

    try {
      const pending = await getPendingRecordsByKinds([
        "carga-accessory-create",
        "carga-accessory-update",
        "carga-accessory-delete",
      ]);
      if (!pending.length) return;

      for (const record of pending) {
        if (record.kind === "carga-accessory-create") {
          const data = { ...record.data };
          delete data.synced;

          await accessoryUsageRepository.create(
            {
              blastId: data.blastId,
              leaderId: data.leaderId,
              usageDate: data.usageDate,
              ikon15m: data.ikon15m,
              p337: data.p337,
              notes: data.notes,
            },
          );

          await markRecordSynced(record.id);
        }

        if (record.kind === "carga-accessory-update") {
          const data = { ...record.data };
          delete data.synced;

          await accessoryUsageRepository.update(
            data.id,
            {
              usageDate: data.usageDate,
              ikon15m: data.ikon15m,
              p337: data.p337,
              notes: data.notes,
            },
            data.updatedBy || startedContext?.leaderName || "Lider",
          );

          await markRecordSynced(record.id);
        }

        if (record.kind === "carga-accessory-delete") {
          await accessoryUsageRepository.remove(record.data.id);
          await markRecordSynced(record.id);
        }
      }

      await loadAccessoryUsageRecords();
    } catch (error) {
      console.error("Error syncing accessory usage:", error);
    } finally {
      accessorySyncingRef.current = false;
      setAccessoryUsageSyncing(false);
    }
  }, [loadAccessoryUsageRecords, startedContext?.leaderName]);

  useEffect(() => {
    if (!hydrated || !isOnline || pendingSyncCount === 0) return;

    const timeoutId = window.setTimeout(() => {
      syncPendingRecords();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [hydrated, isOnline, pendingSyncCount, syncPendingRecords]);

  useEffect(() => {
    if (!hydrated || !isOnline) return;

    const timeoutId = window.setTimeout(() => {
      syncAccessoryPendingRecords();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [hydrated, isOnline, syncAccessoryPendingRecords]);

  async function handleStart() {
    if (!selectedLeader || !selectedBlast) return;

    setStartingTurn(true);

    try {
      const blastFull = await blastRepository.fetchBlastFullLoading(
        selectedBlast.id,
      );
      const holes = blastFull?.holes ?? [];
      const nextContext = buildStartedContext(selectedLeader, selectedBlast);
      const nextDensityDraft = buildDensityDraft(blastFull);

      setStartedContext(nextContext);
      setBlastHoles(holes);
      setDensityDraft(nextDensityDraft);
      const nextDrafts = Object.fromEntries(
        holes.map((hole) => [hole.id, buildLoadingDraft(hole.loading)]),
      );
      setHoleDrafts(nextDrafts);
      setHoleFilter("");
      setActiveHoleId(null);
      setAccessoryUsageModalOpen(false);
      setAccessoryHasPending(false);
      setAccessoryUsageRecords([]);
      resetAccessoryForm();
      setDensityModalOpen(false);

      await saveRecord(
        createPendingRecord(
          nextContext.contextId,
          "carga-context",
          nextContext,
        ),
      );
    } catch (error) {
      console.error("Error loading blast holes for carga:", error);
      const nextContext = buildStartedContext(selectedLeader, selectedBlast);
      setStartedContext(nextContext);
      setBlastHoles([]);
      setDensityDraft(buildDensityDraft());
      setHoleDrafts({});
      setHoleFilter("");
      setActiveHoleId(null);
      setAccessoryUsageModalOpen(false);
      setAccessoryHasPending(false);
      setAccessoryUsageRecords([]);
      resetAccessoryForm();
      setDensityModalOpen(false);
      await saveRecord(
        createPendingRecord(
          nextContext.contextId,
          "carga-context",
          nextContext,
        ),
      );
    } finally {
      setStartingTurn(false);
    }
  }

  async function handleSaveDraft(nextDraft) {
    if (!activeHole) return;

    const draftWithSync = {
      ...nextDraft,
      synced: false,
    };

    setHoleDrafts((current) => ({
      ...current,
      [activeHole.id]: draftWithSync,
    }));
    setActiveHoleId(null);

    if (!startedContext) return;

    await saveRecord(
      createPendingRecord(
        `carga-hole:${startedContext.contextId}:${activeHole.id}`,
        "carga-hole",
        {
          contextId: startedContext.contextId,
          holeId: activeHole.id,
          holeNumber: activeHole.holeNumber,
          blastId: startedContext.blastId,
          leaderId: startedContext.leaderId,
          leaderName: startedContext.leaderName,
          updatedBy: startedContext.leaderName,
          ...draftWithSync,
        },
      ),
    );
  }

  async function handleSaveDensity(nextDraft) {
    const draftWithSync = {
      ...nextDraft,
      synced: false,
    };

    setDensityDraft(draftWithSync);
    setDensityModalOpen(false);

    if (!startedContext) return;

    await saveRecord(
      createPendingRecord(
        `carga-density:${startedContext.contextId}:${startedContext.blastId}`,
        "carga-density",
        {
          contextId: startedContext.contextId,
          blastId: startedContext.blastId,
          leaderId: startedContext.leaderId,
          leaderName: startedContext.leaderName,
          updatedBy: startedContext.leaderName,
          ...draftWithSync,
        },
      ),
    );
  }

  function handleSelectHole(hole) {
    setActiveHoleId(hole?.id ?? null);
  }

  function handleAccessoryFieldChange(field, value) {
    const nextValue =
      field === "ikon15m" || field === "p337"
        ? normalizeAccessoryNumberInput(value)
        : value;

    setAccessoryUsageForm((current) => ({
      ...current,
      [field]: nextValue,
    }));
  }

  function handleAccessoryEdit(record) {
    setAccessoryUsageForm(buildAccessoryUsageFormState(record));
  }

  function resetAccessoryForm() {
    setAccessoryUsageForm(buildAccessoryUsageFormState());
  }

  async function handleAccessorySave() {
    if (!startedContext) return;

    const payload = buildAccessoryPayload(accessoryUsageForm);

    if (window.navigator.onLine && supabaseReady && !isLocalAccessoryId(accessoryUsageForm.id)) {
      try {
        if (accessoryUsageForm.id) {
          await accessoryUsageRepository.update(
            accessoryUsageForm.id,
            payload,
            startedContext.leaderName,
          );
        } else {
          await accessoryUsageRepository.create(
            {
              blastId: startedContext.blastId,
              leaderId: startedContext.leaderId,
              ...payload,
            },
          );
        }

        resetAccessoryForm();
        await loadAccessoryUsageRecords();
        return;
      } catch (error) {
        console.error("Error saving accessory usage:", error);
      }
    }

    if (accessoryUsageForm.id) {
      const nextRecord = {
        ...accessoryUsageRecords.find((record) => record.id === accessoryUsageForm.id),
        ...payload,
        updatedBy: startedContext.leaderName,
        updatedAt: new Date().toISOString(),
        synced: false,
      };

      await persistAccessoryUsageRecords(
        startedContext.blastId,
        accessoryUsageRecords.map((record) =>
          record.id === accessoryUsageForm.id ? nextRecord : record,
        ),
      );

      await saveRecord(
        buildAccessoryPendingRecord(
          isLocalAccessoryId(accessoryUsageForm.id)
            ? accessoryUsageForm.id
            : `carga-accessory-update:${accessoryUsageForm.id}`,
          isLocalAccessoryId(accessoryUsageForm.id)
            ? "carga-accessory-create"
            : "carga-accessory-update",
          nextRecord,
        ),
      );
      setAccessoryHasPending(true);
      resetAccessoryForm();
      return;
    }

    const localId = buildLocalAccessoryId();
    const nextRecord = {
      id: localId,
      blastId: startedContext.blastId,
      leaderId: startedContext.leaderId,
      ...payload,
      createdBy: startedContext.leaderName,
      createdAt: new Date().toISOString(),
      updatedBy: null,
      updatedAt: null,
      synced: false,
    };

    await persistAccessoryUsageRecords(startedContext.blastId, [
      nextRecord,
      ...accessoryUsageRecords,
    ]);
    await saveRecord(
      buildAccessoryPendingRecord(
        localId,
        "carga-accessory-create",
        nextRecord,
      ),
    );
    setAccessoryHasPending(true);
    resetAccessoryForm();
  }

  async function handleAccessoryDelete() {
    if (!accessoryUsageForm.id) return;
    if (!startedContext?.blastId) return;

    const targetId = accessoryUsageForm.id;
    await persistAccessoryUsageRecords(
      startedContext.blastId,
      accessoryUsageRecords.filter((record) => record.id !== targetId),
    );

    if (isLocalAccessoryId(targetId)) {
      await deleteRecord(targetId);
      resetAccessoryForm();
      return;
    }

    if (window.navigator.onLine && supabaseReady) {
      try {
        await accessoryUsageRepository.remove(targetId);
        resetAccessoryForm();
        return;
      } catch (error) {
        console.error("Error deleting accessory usage:", error);
      }
    }

    await saveRecord(
      buildAccessoryPendingRecord(
        `carga-accessory-delete:${targetId}`,
        "carga-accessory-delete",
        {
          id: targetId,
          blastId: startedContext.blastId,
          updatedBy: startedContext?.leaderName || "Lider",
        },
      ),
    );
    setAccessoryHasPending(true);
    resetAccessoryForm();
  }

  async function handleReset() {
    const hasLocalData =
      Boolean(startedContext) ||
      Boolean(leaderId) ||
      Boolean(blastId) ||
      blastHoles.length > 0 ||
      Boolean(densityDraft) ||
      Object.keys(holeDrafts).length > 0;

    if (
      hasLocalData &&
      !window.confirm(
        "Verifica que tus cambios estén sincronizados. Esta accion no se puede deshacer.",
      )
    ) {
      return;
    }

    setLeaderId("");
    setBlastId("");
    setStartedContext(null);
    setBlastHoles([]);
    setDensityDraft(null);
    setHoleDrafts({});
    setActiveHoleId(null);
    setAccessoryUsageModalOpen(false);
    setAccessoryHasPending(false);
    setAccessoryUsageRecords([]);
    resetAccessoryForm();
    setDensityModalOpen(false);
    setHoleFilter("");

    try {
      await clearLocalViewState("carga");
      showToast("Carga reseteada");
    } catch {
      showToast("Error al resetear carga");
    }
  }

  return (
    <main className="min-h-screen bg-(--color-surface-base) pb-20 text-(--color-text-primary)">
      <header className="sticky top-0 z-10 border-b border-(--color-border-subtle) bg-(--color-surface-1)/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.18em] text-(--color-text-muted)">
              FOR-PO-04
            </span>
            <span className="font-(--font-mono) text-(--color-border-strong)">
              /
            </span>
            <span className="font-(--font-mono) text-[0.6875rem] uppercase tracking-[0.18em] text-(--color-brand-cyan)">
              Carga
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

            {(startedContext ||
              leaderId ||
              blastId ||
              blastHoles.length > 0) && (
              <button
                type="button"
                onClick={handleReset}
                className="border-none bg-transparent p-1 font-(--font-mono) text-[0.625rem] uppercase tracking-widest text-(--color-text-muted) transition-colors hover:text-(--color-danger)"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-0 overflow-x-hidden px-2 py-3 sm:px-4 md:px-6 [&_.section-card]:mx-0 [&_.section-card]:w-full [&_.section-card]:min-w-0">
        <CargaLeaderSection
          blastId={blastId}
          blasts={blasts}
          isOnline={isOnline}
          leaderId={leaderId}
          leaders={leaders}
          loading={loading}
          onBlastChange={setBlastId}
          onLeaderChange={setLeaderId}
          onStart={handleStart}
          pendingSyncCount={pendingSyncCount}
          selectedBlast={selectedBlast}
          startedContext={startedContext}
          startingTurn={startingTurn}
          syncing={syncing}
        />

        {startedContext && (
          <CargaHolesSection
            accessorySyncStatus={accessorySyncStatus}
            blastHoles={filteredBlastHoles}
            buildLoadingDraft={buildLoadingDraft}
            cargaBodyHeightClass={cargaBodyHeightClass}
            densityPendingSync={Boolean(
              densityDraft && !isSyncedValue(densityDraft.synced),
            )}
            hasDraftData={hasDraftData}
            hasDensityData={hasDensityData(densityDraft)}
            holeDrafts={holeDrafts}
            holeFilter={holeFilter}
            onOpenAccessoryUsage={() => setAccessoryUsageModalOpen(true)}
            onOpenDensityControl={() => setDensityModalOpen(true)}
            onSelectHole={handleSelectHole}
            onHoleFilterChange={setHoleFilter}
            totalBlastHoles={blastHoles.length}
          />
        )}
      </div>

      {activeHole && activeDraft && (
        <LoadHoleModal
          hole={activeHole}
          draft={activeDraft}
          onClose={() => setActiveHoleId(null)}
          onSave={handleSaveDraft}
        />
      )}

      {densityModalOpen && densityDraft && startedContext && (
        <DensityControlModal
          blast={selectedBlast || startedContext}
          draft={densityDraft}
          onClose={() => setDensityModalOpen(false)}
          onSave={handleSaveDensity}
        />
      )}

      {accessoryUsageModalOpen && startedContext && (
        <CargaAccessoryUsageModal
          blast={selectedBlast || startedContext}
          form={accessoryUsageForm}
          isEditing={isAccessoryEditing}
          onClose={() => setAccessoryUsageModalOpen(false)}
          onDelete={handleAccessoryDelete}
          onEdit={handleAccessoryEdit}
          onFieldChange={handleAccessoryFieldChange}
          onResetForm={resetAccessoryForm}
          onSave={handleAccessorySave}
          records={accessoryUsageRecords}
        />
      )}

      <Toast state={toastState} />
    </main>
  );
}
