import type { QuoteItemState, VenueQuote, Wedding } from "~/data/types";
import type { QuoteQuestion } from "~/lib/finance";
import { QUOTE_ITEM_LABEL } from "~/lib/wedding";

/** Non-component helpers for the venue-quotes tab (kept out of .tsx for Fast Refresh). */

/** Click order for an inclusion cell: not asked → included → not included → not asked. */
export const NEXT_ITEM_STATE: Record<QuoteItemState, QuoteItemState> = {
  unknown: "included",
  included: "not_included",
  not_included: "unknown",
};

export function questionLabel(q: QuoteQuestion): string {
  switch (q.kind) {
    case "item":
      return `Is ${QUOTE_ITEM_LABEL[q.key].toLowerCase()} included?`;
    case "line_amount":
      return `Price for “${q.label}”`;
    case "service_charge":
      return "Service charge on food & drink?";
    case "tax":
      return "Sales tax rate?";
    case "hours":
      return "How many hours are included?";
    case "overtime_rate":
      return "Overtime rate per extra hour?";
  }
}

export function blankQuote(w: Wedding, venueName: string, vendorId: string | null): Omit<VenueQuote, "id"> {
  return {
    weddingId: w.id,
    vendorId,
    venueName,
    receivedDate: null,
    validUntil: null,
    hoursIncluded: null,
    overtimePerHour: null,
    fbMinimum: null,
    serviceChargePct: null,
    taxPct: null,
    taxOnServiceCharge: false,
    lines: [],
    items: {},
    gapOverrides: {},
    notes: "",
  };
}

export function newLineId(): string {
  return `ql_${Math.random().toString(36).slice(2, 10)}`;
}
