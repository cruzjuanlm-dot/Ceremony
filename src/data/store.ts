import { seedDataset } from "./seed";
import type { Dataset, Plan, TableName, Tables, Workspace } from "./types";

/**
 * DEMO-MODE persistence. The whole dataset lives in localStorage, one copy per plan, so the
 * Pro and DIY experiences can be switched between without clobbering each other.
 *
 * The API is deliberately Supabase-shaped (async list/insert/update/remove by table name) so
 * that going live is a swap of THIS FILE for a `supabase.from(table)` implementation —
 * components and hooks never touch localStorage directly.
 *
 * Every localStorage access is wrapped: private windows and blocked storage fall back to an
 * in-memory copy rather than crashing.
 */

const VERSION = 2;
const PLAN_KEY = "ceremony-demo:plan";
const dataKey = (plan: Plan) => `ceremony-demo:v${VERSION}:${plan}`;

const memory = new Map<string, string>();

function readKey(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function writeKey(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* in-memory copy above still holds it */
  }
}

function removeKey(key: string) {
  memory.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function getPlan(): Plan {
  const p = readKey(PLAN_KEY);
  return p === "diy" ? "diy" : "pro";
}

export function setPlan(plan: Plan) {
  writeKey(PLAN_KEY, plan);
  cache = null;
}

let cache: { plan: Plan; data: Dataset } | null = null;

function dataset(): Dataset {
  const plan = getPlan();
  if (cache && cache.plan === plan) return cache.data;
  const raw = readKey(dataKey(plan));
  let data: Dataset | null = null;
  if (raw) {
    try {
      data = JSON.parse(raw) as Dataset;
    } catch {
      data = null;
    }
  }
  if (!data) {
    data = seedDataset(plan, new Date());
    writeKey(dataKey(plan), JSON.stringify(data));
  }
  cache = { plan, data };
  return data;
}

function persist() {
  if (!cache) return;
  writeKey(dataKey(cache.plan), JSON.stringify(cache.data));
}

export function newId(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

/* ---------- synchronous reads (used as react-query initialData — no loading flash) ------- */

export function listSync<K extends TableName>(table: K): Tables[K][] {
  return dataset().tables[table] as Tables[K][];
}

export function workspaceSync(): Workspace {
  return dataset().workspace;
}

function setRows<K extends TableName>(table: K, rows: Tables[K][]) {
  (dataset().tables as Record<TableName, unknown[]>)[table] = rows;
}

/* ---------- async API — the Supabase-shaped surface ---------------------------------- */

export async function list<K extends TableName>(table: K): Promise<Tables[K][]> {
  return listSync(table);
}

export async function insert<K extends TableName>(
  table: K,
  row: Omit<Tables[K], "id"> & { id?: string },
): Promise<Tables[K]> {
  const full = { ...row, id: row.id ?? newId(table.slice(0, 3)) } as Tables[K];
  setRows(table, [...listSync(table), full]);
  persist();
  return full;
}

export async function update<K extends TableName>(
  table: K,
  id: string,
  patch: Partial<Tables[K]>,
): Promise<Tables[K]> {
  let updated: Tables[K] | undefined;
  setRows(table, listSync(table).map((r) => {
    if ((r as { id: string }).id !== id) return r;
    updated = { ...r, ...patch };
    return updated;
  }));
  if (!updated) throw new Error(`No ${table} row with id ${id}`);
  persist();
  return updated;
}

export async function remove<K extends TableName>(table: K, id: string): Promise<void> {
  setRows(table, listSync(table).filter((r) => (r as { id: string }).id !== id));
  persist();
}

export async function updateWorkspace(patch: Partial<Workspace>): Promise<Workspace> {
  const d = dataset();
  d.workspace = { ...d.workspace, ...patch };
  persist();
  return d.workspace;
}

/** Throw away this plan's edits and re-seed (dates are re-anchored to today). */
export function resetDemo(plan: Plan = getPlan()) {
  removeKey(dataKey(plan));
  cache = null;
}
