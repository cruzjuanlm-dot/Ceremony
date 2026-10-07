import type { Wedding } from "~/data/types";
import { addDaysIso } from "~/lib/finance";
import { dateShort } from "~/lib/format";

/**
 * Marriage-license requirements by jurisdiction, from WEDDING_INDUSTRY_RESEARCH.md §1.10–1.11.
 * Items the research marks "(verify)" carry `verify: true` and show as such — this is a list
 * to confirm with the registry, not legal advice.
 */
export interface LicenseItem {
  text: string;
  /** Date-relative hint, e.g. "Not before Jun 26". */
  when?: string;
  verify?: boolean;
}

export type Jurisdiction = "PR" | "FL";

export function jurisdictionOf(city: string): Jurisdiction | null {
  if (/\bPR\b|puerto rico/i.test(city)) return "PR";
  if (/\bFL\b|florida/i.test(city)) return "FL";
  return null;
}

export function licenseChecklist(w: Pick<Wedding, "date" | "ceremonyType">, j: Jurisdiction): { group: string; items: LicenseItem[] }[] {
  const on = (days: number) => (w.date ? dateShort(addDaysIso(w.date, days)) : null);
  const groups: { group: string; items: LicenseItem[] }[] = [];

  if (j === "PR") {
    const tenBefore = on(-10);
    groups.push({
      group: "Puerto Rico — Registro Demográfico",
      items: [
        {
          text: "Medical certificate (lab tests, signed by a physician) — valid only 10 days",
          when: tenBefore ? `Not before ${tenBefore}` : undefined,
        },
        { text: "Government photo ID or passport for both" },
        { text: "Original or certified birth certificates" },
        { text: "Divorce decree or death certificate, if previously married", verify: true },
        { text: "Translations of non-English documents", verify: true },
        { text: "Non-residents: $150 Rentas Internas stamp + sworn non-residency statement" },
        { text: "Residents: license fee", verify: true },
        { text: "Two witnesses, 21+, with government photo ID" },
      ],
    });
  } else {
    const sixty = on(-60);
    const three = on(-3);
    groups.push({
      group: "Florida — county Clerk of Court",
      items: [
        { text: "License fee ~$86, or ~$61 with a 4-hour premarital course (both, within a year)" },
        {
          text: "License is valid 60 days",
          when: sixty ? `Not before ${sixty}` : undefined,
        },
        {
          text: "Residents without the course: 3-day wait",
          when: three ? `By ${three}` : undefined,
        },
        { text: "No blood test" },
        { text: "Officiant: clergy, judge or Florida notary" },
        { text: "No witnesses required by state law", verify: true },
      ],
    });
  }

  if (w.ceremonyType === "catholic") {
    const parish = on(-180);
    groups.push({
      group: "Catholic ceremony — parish",
      items: [
        { text: "Contact the parish 6–12 months ahead", when: parish ? `By ${parish}` : undefined },
        { text: "Recently issued baptismal certificate (often within 6 months)" },
        { text: "Confirmation and communion records" },
        { text: "Pre-Cana / cursillo prematrimonial certificate" },
        { text: "Prenuptial interview and freedom-to-marry forms" },
        { text: "Letter from the home parish if marrying elsewhere", verify: true },
      ],
    });
  }
  return groups;
}

/** Atlantic hurricane season: June 1 – November 30. */
export function inHurricaneSeason(isoDay: string | null): boolean {
  if (!isoDay) return false;
  const m = Number(isoDay.slice(5, 7));
  return m >= 6 && m <= 11;
}
