import type { ReactNode } from "react";

import { cn } from "~/shared/libretto";

/** The one dominant element on a screen (DESIGN_LANGUAGE §4): a label, a big number, a qualifier. */
export function Hero({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("mb-6 rounded-xl bg-card px-5 py-5 elevate sm:px-6", className)}>{children}</section>;
}

export function HeroFigure({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl", valueClassName)}>{value}</div>
      {sub && <div className="mt-1.5 text-sm text-muted-foreground">{sub}</div>}
    </div>
  );
}
