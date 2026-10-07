import type { Wedding } from "~/data/types";

/** Placeholder — being built. Contract: `<TimelineTab wedding={wedding} />`. */
export function TimelineTab({ wedding }: { wedding: Wedding }) {
  return <div className="text-sm text-muted-foreground">{wedding.title}</div>;
}
