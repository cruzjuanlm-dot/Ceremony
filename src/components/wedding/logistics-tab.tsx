import type { Wedding } from "~/data/types";

/** Placeholder — being built. Contract: `<LogisticsTab wedding={wedding} />`. */
export function LogisticsTab({ wedding }: { wedding: Wedding }) {
  return <div className="text-sm text-muted-foreground">{wedding.title}</div>;
}
