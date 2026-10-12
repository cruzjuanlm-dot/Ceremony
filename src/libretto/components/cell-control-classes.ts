import { cn } from "@/lib/utils";

/**
 * The ghost recipe every in-cell control shares — established by CellNumber and extended to
 * selects, comboboxes and text inputs. A data table shows dozens of controls at once;
 * drawing a box (or a chevron, or a trash can) on each buries the content under chrome, so
 * the contract is: a cell reads as TEXT at rest, hints its affordances while its ROW is
 * hovered, and shows the full control only under the cursor or focus. Touch devices get the
 * affordances always — there is no hover to reveal them.
 *
 * In its own module (like segmented-control-classes.ts) so component files export only
 * components — React Fast Refresh requires that.
 */
export const cellControlClass = cn(
  "h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-sm shadow-none transition-colors",
  "hover:border-input hover:bg-background",
  "focus-visible:border-input focus-visible:bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

/**
 * Same recipe for Radix triggers (Select, the person combobox), which use :focus rather
 * than :focus-visible and carry `data-state=open` while their popup is up. The trigger's
 * chevron is its direct-child svg: invisible at rest, hinted while the row is hovered,
 * full-strength on the control itself. `[tr:hover_&>svg]` is what scopes the hint to the
 * hovered table row without every caller having to declare a hover group.
 */
export const cellTriggerClass = cn(
  "h-8 rounded-md border-transparent bg-transparent px-2 text-sm shadow-none transition-colors",
  "hover:border-input hover:bg-background",
  "focus:border-input focus:bg-background focus:ring-1",
  "data-[state=open]:border-input data-[state=open]:bg-background",
  "[&>svg]:opacity-0 [&>svg]:transition-opacity",
  "[tr:hover_&>svg]:opacity-40 [&:hover>svg]:opacity-60 [&:focus>svg]:opacity-60",
  "[&[data-state=open]>svg]:opacity-60",
  "[@media(pointer:coarse)]:[&>svg]:opacity-50",
);

/**
 * Row-scoped actions — the delete button, the "…" menu. Invisible until the row is hovered,
 * the button focused, or its own popup open. Apply to the button itself
 * (`data-[state=open]` — Radix stamps the trigger) or to a wrapper (`focus-within` +
 * `has-[[data-state=open]]` — a Radix popup portals its content, so focus alone can't hold
 * the wrapper visible while the popup is up).
 */
export const cellActionClass = cn(
  "opacity-0 transition-opacity",
  "[tr:hover_&]:opacity-100 focus-visible:opacity-100 focus-within:opacity-100",
  "data-[state=open]:opacity-100 has-[[data-state=open]]:opacity-100",
  "[@media(pointer:coarse)]:opacity-100",
);
