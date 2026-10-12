import { cn } from "@/lib/utils";

/**
 * The segmented control's styling, kept in its own module so the component file exports only
 * a component (React Fast Refresh requires that).
 *
 * These exist so navigation that *looks* segmented — the Resources tabs, which must render
 * router `Link`s with their own typed `to` prop rather than buttons — still shares one
 * definition of the look with `<SegmentedControl>`. One source of truth, two renderers.
 */

export type SegmentedSize = "sm" | "md";

export function segmentedShell(size: SegmentedSize = "sm") {
  return cn(
    "inline-flex items-center rounded-lg border bg-muted/40 p-0.5",
    size === "sm" ? "text-xs" : "text-sm",
  );
}

export function segmentedItem(selected: boolean) {
  return cn(
    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    selected ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
  );
}
