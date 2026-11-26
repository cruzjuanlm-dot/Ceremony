import { normalizePortalShare } from "~/lib/portal";

import { seedDataset } from "./seed";
import type {
  Booking,
  BudgetLine,
  Client,
  Dataset,
  FeeModel,
  Plan,
  PortalShare,
  TableName,
  Tables,
  TimelineItem,
  Workspace,
} from "./types";

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

/**
 * v9 — a wedding can have a read-only couple view (`portalShares`).
 * The newest readable key from v4 through v9 wins, and that blob is copied forward.
 * Older keys are left in place.
 *
 * v8 added sub-events. A budget line, vendor booking, or timeline cue can point at one.
 * Those links stay blank, and the list stays empty, until someone sets them.
 * v7 added service-charge and tax percents. Blank stays blank — it is not zero.
 * v6 copied a legacy `planningFee` into a flat fee model.
 * v5 added tip envelopes (`gratuities`). A v5 save written by the couple-view branch
 * has `portalShares` instead; this migration keeps those rows and fills the rest.
 * v4 is the original demo.
 *
 * Anything older than v4, or unreadable, is re-seeded.
 * Running the migration twice changes nothing the second time.
 */
const VERSION = 9;
const OLDEST_VERSION = 4;
const PLAN_KEY = "ceremony-demo:plan";
const dataKey = (plan: Plan, version = VERSION) => `ceremony-demo:v${version}:${plan}`;

const FEE_MODELS: readonly FeeModel[] = ["flat", "percent", "hybrid", "hourly"];

/**
 * Fill fields an older save doesn't have.
 * A legacy `planningFee` becomes a flat fee. Service charge, tax, and sub-event
 * links stay blank. Missing tip envelopes and couple-view rows become empty lists.
 * Unknown couple-view sections are dropped, and a share for a missing wedding is removed.
 */
export function migrateDemoDataset(raw: Dataset): { data: Dataset; changed: boolean } {
  if (!raw?.tables) return { data: raw, changed: false };
  let changed = false;
  const tables = raw.tables;
  const plan: Plan = raw.workspace?.plan === "diy" ? "diy" : "pro";

  if (Array.isArray(tables.clients)) {
    for (const row of tables.clients) {
      const legacy = row as Client & { planningFee?: number };
      if (!FEE_MODELS.includes(legacy.feeModel)) {
        const flat = typeof legacy.planningFee === "number" ? legacy.planningFee : null;
        legacy.feeModel = "flat";
        legacy.feeFlat = flat;
        legacy.feePercent = null;
        legacy.feeHours = null;
        legacy.feeRate = null;
        changed = true;
      }
      if ("planningFee" in legacy) {
        delete legacy.planningFee;
        changed = true;
      }
    }
  }

  if (Array.isArray(tables.budgetLines)) {
    for (const row of tables.budgetLines) {
      const legacy = row as BudgetLine;
      if (legacy.serviceChargePct === undefined) {
        legacy.serviceChargePct = null;
        changed = true;
      }
      if (legacy.taxPct === undefined) {
        legacy.taxPct = null;
        changed = true;
      }
      if (legacy.subEventId === undefined) {
        legacy.subEventId = null;
        changed = true;
      }
    }
  }

  if (!Array.isArray(tables.subEvents)) {
    tables.subEvents = [];
    changed = true;
  }
  if (!Array.isArray(tables.gratuities)) {
    tables.gratuities = [];
    changed = true;
  }

  if (Array.isArray(tables.bookings)) {
    for (const row of tables.bookings) {
      const legacy = row as Booking;
      if (legacy.subEventId === undefined) {
        legacy.subEventId = null;
        changed = true;
      }
    }
  }
  if (Array.isArray(tables.timeline)) {
    for (const row of tables.timeline) {
      const legacy = row as TimelineItem;
      if (legacy.subEventId === undefined) {
        legacy.subEventId = null;
        changed = true;
      }
    }
  }

  if (migratePortalShares(tables, plan)) changed = true;
  return { data: raw, changed };
}

function migratePortalShares(tables: Dataset["tables"], plan: Plan): boolean {
  const existing = tables.portalShares;
  if (!Array.isArray(existing)) {
    tables.portalShares = [];
    return true;
  }

  const weddingIds = new Set(
    (Array.isArray(tables.weddings) ? tables.weddings : []).map((wedding) => wedding.id),
  );
  let changed = false;
  const portalShares: PortalShare[] = [];
  for (const share of existing) {
    if (!share || typeof share !== "object" || typeof share.weddingId !== "string" || !weddingIds.has(share.weddingId)) {
      changed = true;
      continue;
    }
    if (share.token != null && typeof share.token !== "string") {
      changed = true;
      continue;
    }
    const next = normalizePortalShare(share, plan);
    if (!sameShare(share, next)) changed = true;
    portalShares.push(next);
  }
  if (changed) tables.portalShares = portalShares;
  return changed;
}

function sameShare(share: PortalShare, next: PortalShare) {
  if (share.id !== next.id || share.token !== next.token || share.enabled !== next.enabled) return false;
  if (!Array.isArray(share.visible) || share.visible.length !== next.visible.length) return false;
  return next.visible.every((module, i) => module === share.visible[i]);
}

function parseDataset(raw: string | null): Dataset | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Dataset;
    if (!value?.tables || !Array.isArray(value.tables.weddings) || !value.workspace) return null;
    return value;
  } catch {
    return null;
  }
}

/**
 * Pick the dataset for this plan. The current save wins. Otherwise the newest
 * readable older save is migrated. Anything unreadable is replaced with a fresh seed.
 */
export function resolveStoredDataset(
  rawByVersion: Partial<Record<number, string | null | undefined>>,
  plan: Plan,
  now: Date,
): { data: Dataset; persist: boolean } {
  for (let version = VERSION; version >= OLDEST_VERSION; version--) {
    const parsed = parseDataset(rawByVersion[version] ?? null);
    if (!parsed) continue;
    const migrated = migrateDemoDataset(parsed);
    return { data: migrated.data, persist: version !== VERSION || migrated.changed };
  }
  return { data: seedDataset(plan, now), persist: true };
}

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
  const rawByVersion: Partial<Record<number, string | null>> = {};
  for (let version = VERSION; version >= OLDEST_VERSION; version--) {
    rawByVersion[version] = readKey(dataKey(plan, version));
  }
  const resolved = resolveStoredDataset(rawByVersion, plan, new Date());
  cache = { plan, data: resolved.data };
  if (resolved.persist) persist();
  return resolved.data;
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
  const rows = dataset().tables[table];
  return Array.isArray(rows) ? rows : [];
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
  const [full] = await insertMany(table, [row]);
  if (!full) throw new Error(`Could not insert into ${table}`);
  return full;
}

export async function insertMany<K extends TableName>(
  table: K,
  rows: (Omit<Tables[K], "id"> & { id?: string })[],
): Promise<Tables[K][]> {
  const full = rows.map((row) => ({ ...row, id: row.id ?? newId(table.slice(0, 3)) }) as Tables[K]);
  if (full.length === 0) return [];
  setRows(table, [...listSync(table), ...full]);
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
  for (let version = OLDEST_VERSION; version <= VERSION; version++) removeKey(dataKey(plan, version));
  cache = null;
}
