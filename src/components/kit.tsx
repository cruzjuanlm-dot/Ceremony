import type { ReactNode } from "react";

import { cn } from "~/shared/libretto";

/**
 * Ceremony's small shared kit — the patterns Libretto repeats inline (KPI tile, titled panel,
 * status chip, empty state), lifted into one file so every Ceremony screen uses the same
 * ones. Visuals match Libretto's dashboard exactly (`rounded-xl bg-card elevate` tiles,
 * `rounded-lg border bg-card` panels) — if Libretto restyles those, mirror it HERE once.
 */

export function StatTile({
  label,
  value,
  sub,
  tone,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-card px-4 py-3.5 elevate", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", tone && TONE_TEXT[tone])}>{value}</div>
      {sub && <div className="mt-1.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-lg border bg-card", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className={cn("px-4 py-3", bodyClassName)}>{children}</div>
    </section>
  );
}

/**
 * Tones carry Libretto's fixed meanings (DESIGN_LANGUAGE §6): good = green (paid, booked,
 * attending), bad = red (overdue, over budget, declined), warn = amber (due soon, pending),
 * info = blue (budgeted/expected only), brand = Ceremony's champagne accent, muted = neutral.
 */
export type Tone = "good" | "bad" | "warn" | "info" | "brand" | "muted";

const TONE_TEXT: Record<Tone, string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  bad: "text-red-600 dark:text-red-400",
  warn: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
  brand: "text-primary",
  muted: "text-muted-foreground",
};

const TONE_CHIP: Record<Tone, string> = {
  good: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  bad: "bg-red-500/12 text-red-700 dark:text-red-400",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  info: "bg-blue-500/12 text-blue-700 dark:text-blue-400",
  brand: "bg-accent text-accent-foreground",
  muted: "bg-muted text-muted-foreground",
};

export const toneText = (t: Tone) => TONE_TEXT[t];

/** Always a word, never colour alone (§6). */
export function Chip({ tone = "muted", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        TONE_CHIP[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-dashed p-10 text-center", className)}>
      <h2 className="text-base font-semibold">{title}</h2>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** Thin progress bar for checklist / RSVP / budget-used meters. */
export function Meter({ value, max, tone = "brand", className, label }: { value: number; max: number; tone?: Tone; className?: string; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const bar: Record<Tone, string> = {
    good: "bg-emerald-500",
    bad: "bg-red-500",
    warn: "bg-amber-500",
    info: "bg-blue-500",
    brand: "bg-primary",
    muted: "bg-muted-foreground/40",
  };
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div className={cn("h-full rounded-full transition-[width]", bar[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Couple-name display in the brand serif — the one place Ceremony departs from Libretto's type. */
export function CoupleName({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-display font-semibold tracking-tight", className)}>{children}</span>;
}
