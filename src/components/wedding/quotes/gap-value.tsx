import { Check, HelpCircle } from "lucide-react";

import type { QuoteGap } from "~/lib/finance";
import { money } from "~/lib/format";

/** One needed item against one quote: "Included", the cost to cover it elsewhere, or that cost flagged as not asked yet. */
export function GapValue({ gap }: { gap: QuoteGap }) {
  if (gap.state === "included")
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        Included
      </span>
    );
  if (gap.state === "unknown")
    return (
      <span className="inline-flex items-center gap-1 tabular-nums text-amber-600 dark:text-amber-400">
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
        {money(gap.cost)}
        <span className="sr-only"> (not asked yet)</span>
      </span>
    );
  return <span className="tabular-nums">{money(gap.cost)}</span>;
}
