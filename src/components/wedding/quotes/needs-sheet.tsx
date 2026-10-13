import { Button } from "@libretto-ui/button";
import { Checkbox } from "@libretto-ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@libretto-ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libretto-ui/table";

import { useUpdate } from "~/data/hooks";
import type { QuoteItemKey, VenueNeeds, Wedding } from "~/data/types";
import { QUOTE_ITEM_DEFAULTS, resolveVenueNeeds } from "~/lib/finance";
import { money } from "~/lib/format";
import { QUOTE_ITEM_LABEL } from "~/lib/wedding";
import { cn } from "~/shared/libretto";

import { CellAmount } from "../fields";

/**
 * The yardstick: which things this wedding needs from (or around) a venue, and what each
 * costs when the venue doesn't cover it. Every quote is measured against this one list.
 */
export function NeedsSheet({
  open,
  onOpenChange,
  wedding: w,
  guests,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  wedding: Wedding;
  guests: number;
}) {
  const update = useUpdate("weddings");
  const needs = resolveVenueNeeds(w, guests);

  const patchItem = (key: QuoteItemKey, patch: { needed?: boolean; estimate?: number | null }) => {
    const current: VenueNeeds = w.venueNeeds ?? { hoursNeeded: needs.hoursNeeded, items: {} };
    update.mutate({
      id: w.id,
      patch: {
        venueNeeds: { ...current, items: { ...current.items, [key]: { ...current.items[key], ...patch } } },
      },
    });
  };

  const customised = Object.keys(w.venueNeeds?.items ?? {}).length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pr-8 text-left">
          <SheetTitle>What we need</SheetTitle>
          <p className="text-sm text-muted-foreground">Cost to cover each one if a venue doesn't, at {guests} guests.</p>
        </SheetHeader>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Item</TableHead>
              <TableHead numeric>Estimate</TableHead>
              <TableHead numeric>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {needs.items.map((n) => (
              <TableRow key={n.key} className={cn(!n.needed && "text-muted-foreground")}>
                <TableCell>
                  <Checkbox
                    checked={n.needed}
                    aria-label={`Need ${QUOTE_ITEM_LABEL[n.key]}`}
                    onCheckedChange={(c) => patchItem(n.key, { needed: c === true })}
                  />
                </TableCell>
                <TableCell>{QUOTE_ITEM_LABEL[n.key]}</TableCell>
                <TableCell numeric className="py-1">
                  <div className="flex items-center justify-end gap-1">
                    <CellAmount
                      ariaLabel={`${QUOTE_ITEM_LABEL[n.key]} estimate`}
                      value={n.estimate}
                      onCommit={(v) => patchItem(n.key, { estimate: v })}
                      className="h-7 w-24"
                    />
                    <span className="w-10 text-left text-xs text-muted-foreground">
                      {QUOTE_ITEM_DEFAULTS[n.key].basis === "per_guest" ? "/ guest" : ""}
                    </span>
                  </div>
                </TableCell>
                <TableCell numeric>{n.needed ? money(n.total) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {customised && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() =>
              update.mutate({ id: w.id, patch: { venueNeeds: { hoursNeeded: needs.hoursNeeded, items: {} } } })
            }
          >
            Reset to defaults
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
