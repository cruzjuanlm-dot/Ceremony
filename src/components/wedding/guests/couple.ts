import type { Guest, MealChoice, RsvpStatus } from "~/data/types";
import { MEAL_LABEL } from "~/lib/wedding";

/** "Ana & Luis" → ["Ana", "Luis"]. Anything unparseable falls back to Partner 1 / Partner 2. */
export function coupleFirstNames(title: string): [string, string] {
  const parts = title
    .split(/\s*(?:&|\+|\band\b|\by\b)\s*/i)
    .map((p) => p.trim().split(/\s+/)[0] ?? "")
    .filter(Boolean);
  return [parts[0] || "Partner 1", parts[1] || "Partner 2"];
}

export function sideLabels(title: string): Record<Guest["side"], string> {
  const [a, b] = coupleFirstNames(title);
  return { partner1: a, partner2: b, both: "Both" };
}

export const TABLE_SEATS = 10;

export const RSVP_OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: "pending", label: "Awaiting" },
  { value: "attending", label: "Attending" },
  { value: "declined", label: "Declined" },
];

export const MEAL_OPTIONS = (Object.keys(MEAL_LABEL) as MealChoice[]).map((m) => ({ value: m, label: MEAL_LABEL[m] }));

export const fullName = (g: Pick<Guest, "firstName" | "lastName">) => `${g.firstName} ${g.lastName}`.trim();
