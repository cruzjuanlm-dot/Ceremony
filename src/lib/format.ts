/** Display formatting. Blank is not zero: null/undefined render as "—" (DESIGN_LANGUAGE §6). */

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function money(n: number | null | undefined): string {
  if (n == null) return "—";
  return usd0.format(n);
}

/** Compact money for tiles: $68k, $1.2M. */
export function moneyCompact(n: number | null | undefined): string {
  if (n == null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${n < 0 ? "-" : ""}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${n < 0 ? "-" : ""}$${Math.round(abs / 1000)}k`;
  return money(n);
}

function parseDay(isoDay: string) {
  const [y, m, d] = isoDay.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dateLong(isoDay: string | null | undefined): string {
  if (!isoDay) return "—";
  return parseDay(isoDay).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function dateShort(isoDay: string | null | undefined): string {
  if (!isoDay) return "—";
  const d = parseDay(isoDay);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
}

export function time12(hhmm: string | null | undefined): string {
  if (!hhmm) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}

export function dateTimeShort(isoInstant: string): string {
  const d = new Date(isoInstant);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** "2h ago", "Yesterday", "Mar 4" — for inbox-style lists. */
export function relativeTime(isoInstant: string, now = new Date()): string {
  const d = new Date(isoInstant);
  const mins = Math.round((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function initials(name: string): string {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
}

export const pct = (n: number) => `${Math.round(n * 100)}%`;
