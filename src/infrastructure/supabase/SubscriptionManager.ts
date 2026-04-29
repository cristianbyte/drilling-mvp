import { supabase } from "./supabaseClient";
import { HoleFull } from "../../core/entities/entities";

export class SubscriptionManager {
  subscribeHolesByBlast(
    blastId: string,
    fetchFn: (blastId: string) => Promise<HoleFull[]>,
    callback: (data: HoleFull[]) => void,
  ): () => void {
    const subscription = supabase
      .channel(`holes:${blastId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "holes",
          filter: `blast_id=eq.${blastId}`,
        },
        () => fetchFn(blastId).then(callback),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hole_drilling",
        },
        () => fetchFn(blastId).then(callback),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hole_loading",
        },
        () => fetchFn(blastId).then(callback),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  subscribeSupervisorRows(
    options: { limit?: number; date?: string },
    fetchFn: () => Promise<any[]>,
    callback: (data: any[]) => void,
  ): () => void {
    const channelName = `supervisor-rows:${options?.date ?? "recent"}:${options?.limit ?? "all"}`;

    const subscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "holes",
        },
        () => fetchFn().then(callback),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hole_drilling",
        },
        () => fetchFn().then(callback),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "operators",
        },
        () => fetchFn().then(callback),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blasts",
        },
        () => fetchFn().then(callback),
      )
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(`Realtime ${channelName} status:`, status, error);
        }

        if (status === "SUBSCRIBED") {
          console.info(`Realtime ${channelName} subscribed`);
        }
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  subscribeRecentHoles(
    limit: number,
    fetchFn: (limit: number) => Promise<Record<string, any>>,
    callback: (data: Record<string, any>) => void,
  ): () => void {
    const subscription = supabase
      .channel("recent-holes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "holes",
        },
        () => fetchFn(limit).then(callback),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hole_drilling",
        },
        () => fetchFn(limit).then(callback),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }
}
