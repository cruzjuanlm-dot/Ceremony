import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import * as store from "./store";
import type { Plan, TableName, Tables, Workspace } from "./types";

/**
 * The only way components read or write data. react-query keys are `[plan, table]`, so a
 * plan switch is just `queryClient.clear()` — see usePlanSwitch.
 *
 * Reads use the store's synchronous snapshot as `initialData`, so `data` is never undefined
 * and nothing flashes a loading state in demo mode. When this goes live on Supabase, drop
 * initialData and handle `isLoading` — the call sites' shape stays the same.
 */

export function useRows<K extends TableName>(table: K): Tables[K][] {
  const plan = store.getPlan();
  const { data } = useQuery({
    queryKey: [plan, table],
    queryFn: () => store.list(table),
    initialData: () => store.listSync(table),
    staleTime: Infinity,
  });
  return data;
}

export function useWorkspace(): Workspace {
  const plan = store.getPlan();
  const { data } = useQuery({
    queryKey: [plan, "workspace"],
    queryFn: async () => store.workspaceSync(),
    initialData: () => store.workspaceSync(),
    staleTime: Infinity,
  });
  return data;
}

export function usePlan(): Plan {
  return useWorkspace().plan;
}

function useInvalidate(table: TableName | "workspace") {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [store.getPlan(), table] });
}

const onError = (e: unknown) =>
  toast.error(e instanceof Error ? e.message : "Something went wrong");

export function useInsert<K extends TableName>(table: K) {
  const invalidate = useInvalidate(table);
  return useMutation({
    mutationFn: (row: Omit<Tables[K], "id"> & { id?: string }) => store.insert(table, row),
    onSuccess: invalidate,
    onError,
  });
}

export function useUpdate<K extends TableName>(table: K) {
  const invalidate = useInvalidate(table);
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Tables[K]> }) =>
      store.update(table, id, patch),
    onSuccess: invalidate,
    onError,
  });
}

export function useRemove<K extends TableName>(table: K) {
  const invalidate = useInvalidate(table);
  return useMutation({
    mutationFn: (id: string) => store.remove(table, id),
    onSuccess: invalidate,
    onError,
  });
}

export function useUpdateWorkspace() {
  const invalidate = useInvalidate("workspace");
  return useMutation({
    mutationFn: (patch: Partial<Workspace>) => store.updateWorkspace(patch),
    onSuccess: invalidate,
    onError,
  });
}

/** Switch Pro ⇄ DIY (each has its own demo dataset) or re-seed the current one. */
export function useDemoControls() {
  const qc = useQueryClient();
  return {
    // A hard reload is the honest way to swap whole datasets: every mounted query re-reads
    // from the new plan's snapshot, with no stale observer left pointing at the old one.
    switchPlan(plan: Plan) {
      store.setPlan(plan);
      qc.clear();
      window.location.assign("/dashboard");
    },
    reset() {
      store.resetDemo();
      qc.clear();
      window.location.reload();
    },
  };
}

/* ---------- convenience selectors ---------------------------------------------------- */

export function useWedding(id: string) {
  return useRows("weddings").find((w) => w.id === id) ?? null;
}

export function useWeddingRows<K extends Exclude<TableName, "weddings" | "clients" | "vendors">>(
  table: K,
  weddingId: string,
): Tables[K][] {
  return useRows(table).filter(
    (r) => (r as { weddingId: string | null }).weddingId === weddingId,
  );
}
