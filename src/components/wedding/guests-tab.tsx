import type { Wedding } from "~/data/types";

/** Placeholder — being built. Contract: `<GuestsTab wedding={wedding} />`. */
export function GuestsTab({ wedding }: { wedding: Wedding }) {
  return <div className="text-sm text-muted-foreground">{wedding.title}</div>;
}
