import type { TimelineItem, TimelineSegment } from "~/data/types";

import { fromMin, toMin } from "./time";

export const DEFAULT_CEREMONY = "17:00";

export const SEGMENT_ORDER: TimelineSegment[] = ["getting_ready", "photos", "ceremony", "cocktail", "reception", "after"];

export const endTime = (it: Pick<TimelineItem, "time" | "durationMin">) => fromMin(toMin(it.time) + (it.durationMin || 0));

export function sortByTime(items: TimelineItem[]): TimelineItem[] {
  return [...items].sort((a, b) => toMin(a.time) - toMin(b.time) || b.durationMin - a.durationMin);
}

/**
 * Consecutive runs of the same segment, in time order. Photos happen both before and after
 * the ceremony, so a strict group-by would pull the family formals out of sequence.
 */
export function segmentRuns(sorted: TimelineItem[]): { segment: TimelineSegment; items: TimelineItem[] }[] {
  const runs: { segment: TimelineSegment; items: TimelineItem[] }[] = [];
  for (const it of sorted) {
    const last = runs[runs.length - 1];
    if (last && last.segment === it.segment) last.items.push(it);
    else runs.push({ segment: it.segment, items: [it] });
  }
  return runs;
}

const placeKey = (s: string) => s.trim().toLowerCase();

/** item id → titles of other items booked into the same place at the same time. */
export function findOverlaps(items: TimelineItem[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    if (!a.location.trim() || a.durationMin <= 0) continue;
    const a0 = toMin(a.time);
    const a1 = a0 + a.durationMin;
    for (let j = i + 1; j < items.length; j++) {
      const b = items[j];
      if (b.durationMin <= 0 || placeKey(a.location) !== placeKey(b.location)) continue;
      const b0 = toMin(b.time);
      const b1 = b0 + b.durationMin;
      if (a0 < b1 && b0 < a1) {
        out.set(a.id, [...(out.get(a.id) ?? []), b.title]);
        out.set(b.id, [...(out.get(b.id) ?? []), a.title]);
      }
    }
  }
  return out;
}

/** Standard run of show, minutes relative to the ceremony start. Kept short on purpose. */
const TEMPLATE: { offset: number; dur: number; title: string; segment: TimelineSegment; location: string; owner: string }[] = [
  { offset: -300, dur: 180, title: "Hair and makeup", segment: "getting_ready", location: "Bridal suite", owner: "Hair & makeup" },
  { offset: -180, dur: 30, title: "Photographer arrives; detail shots", segment: "getting_ready", location: "", owner: "Photographer" },
  { offset: -120, dur: 30, title: "Getting dressed", segment: "getting_ready", location: "Bridal suite", owner: "" },
  { offset: -90, dur: 20, title: "First look", segment: "photos", location: "", owner: "Photographer" },
  { offset: -65, dur: 30, title: "Wedding party photos", segment: "photos", location: "", owner: "Photographer" },
  { offset: -30, dur: 30, title: "Guests arrive", segment: "ceremony", location: "Ceremony site", owner: "" },
  { offset: 0, dur: 30, title: "Ceremony", segment: "ceremony", location: "Ceremony site", owner: "Officiant" },
  { offset: 30, dur: 30, title: "Family photos", segment: "photos", location: "Ceremony site", owner: "Photographer" },
  { offset: 45, dur: 60, title: "Cocktail hour", segment: "cocktail", location: "", owner: "Caterer" },
  { offset: 105, dur: 10, title: "Grand entrance", segment: "reception", location: "Reception", owner: "DJ / MC" },
  { offset: 115, dur: 10, title: "First dance", segment: "reception", location: "Reception", owner: "DJ / MC" },
  { offset: 125, dur: 60, title: "Dinner and toasts", segment: "reception", location: "Reception", owner: "Caterer" },
  { offset: 195, dur: 10, title: "Cake cutting", segment: "reception", location: "Reception", owner: "Caterer" },
  { offset: 300, dur: 15, title: "Last dance and send-off", segment: "after", location: "", owner: "" },
];

export function templateItems(weddingId: string, ceremonyTime: string | null): Omit<TimelineItem, "id">[] {
  const anchor = toMin(ceremonyTime ?? DEFAULT_CEREMONY);
  return TEMPLATE.map((t) => ({
    weddingId,
    time: fromMin(anchor + t.offset),
    durationMin: t.dur,
    title: t.title,
    segment: t.segment,
    location: t.location,
    owner: t.owner,
    notes: "",
  }));
}
