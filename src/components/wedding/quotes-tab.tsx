import { useState } from "react";
import { AlertTriangle, ListChecks } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Input } from "@libretto-ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableSectionRow,
} from "@libretto-ui/table";

import { Chip, EmptyState } from "~/components/kit";
import { useRows, useUpdate, useWeddingRows } from "~/data/hooks";
import type { Booking, QuoteItemKey, Vendor, VenueQuote, Wedding } from "~/data/types";
import { rankQuotes, resolveVenueNeeds, stickerTrap, type RankedQuote } from "~/lib/finance";
import { money } from "~/lib/format";
import { QUOTE_ITEM_LABEL, QUOTE_ITEM_STATE_LABEL } from "~/lib/wedding";
import { cn } from "~/shared/libretto";

import { InlineFact } from "./fields";
import { AddQuoteButton } from "./quotes/add-quote-dialog";
import { GapValue } from "./quotes/gap-value";
import { NeedsSheet } from "./quotes/needs-sheet";
import { NEXT_ITEM_STATE } from "./quotes/quote-helpers";
import { QuoteSheet } from "./quotes/quote-sheet";
import { parseAmount } from "./wedding-helpers";

export function QuotesTab({ wedding: w }: { wedding: Wedding }) {
  const quotes = useWeddingRows("venueQuotes", w.id);
  const bookings = useWeddingRows("bookings", w.id);
  const vendors = useRows("vendors");
  const updateWedding = useUpdate("weddings");
  const [guestDraft, setGuestDraft] = useState<string | null>(null);
  const [guests, setGuests] = useState(w.guestEstimate);
  const [openId, setOpenId] = useState<string | null>(null);
  const [needsOpen, setNeedsOpen] = useState(false);

  const needs = resolveVenueNeeds(w, guests);
  const ranked = rankQuotes(quotes, guests, needs);
  const trap = stickerTrap(ranked);
  const open = ranked.find((r) => r.quote.id === openId) ?? null;

  const setHours = (v: string) =>
    updateWedding.mutate({
      id: w.id,
      patch: { venueNeeds: { items: w.venueNeeds?.items ?? {}, hoursNeeded: parseAmount(v) } },
    });

  const toolbar = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="vq-guests" className="block px-1 text-xs text-muted-foreground">
            Compare at
          </label>
          <div className="mt-0.5 flex items-center gap-1.5 text-sm">
            <Input
              id="vq-guests"
              inputMode="numeric"
              value={guestDraft ?? String(guests)}
              onChange={(e) => setGuestDraft(e.target.value)}
              onBlur={() => {
                const n = parseAmount(guestDraft ?? "");
                if (n != null && n > 0) setGuests(Math.round(n));
                setGuestDraft(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="h-7 w-16 px-1.5 text-right text-sm font-medium tabular-nums"
            />
            <span className="text-muted-foreground">guests</span>
          </div>
        </div>
        <InlineFact
          label="Hours needed"
          display={needs.hoursNeeded == null ? "—" : `${needs.hoursNeeded} hours`}
          value={needs.hoursNeeded == null ? "" : String(needs.hoursNeeded)}
          type="number"
          onCommit={setHours}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setNeedsOpen(true)}>
          <ListChecks className="mr-1.5 h-4 w-4" />
          What we need
        </Button>
        <AddQuoteButton wedding={w} vendors={vendors} quotes={quotes} onAdded={setOpenId} />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-6">
      {toolbar}

      {quotes.length === 0 ? (
        <EmptyState
          title="No venue quotes yet"
          action={<AddQuoteButton wedding={w} vendors={vendors} quotes={quotes} onAdded={setOpenId} />}
        >
          Add each venue's quote as they wrote it. Ceremony prices what each one leaves out, so you
          can compare real totals.
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ranked.map((r) => (
              <QuoteCard
                key={r.quote.id}
                r={r}
                guests={guests}
                vendor={vendors.find((v) => v.id === r.quote.vendorId)}
                booked={isBooked(r.quote, bookings)}
                onOpen={() => setOpenId(r.quote.id)}
              />
            ))}
          </div>

          {trap && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2.5 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>
                <span className="font-medium">{trap.trap.quote.venueName}</span> has the lowest quote (
                {money(trap.trap.cost.subtotal)}) but costs{" "}
                <span className="font-medium">{money(trap.trap.vsBest)} more</span> than{" "}
                {trap.best.quote.venueName} once you add what it leaves out.
              </span>
            </p>
          )}

          <Comparison ranked={ranked} needs={needs.items.filter((n) => n.needed).map((n) => n.key)} />
        </>
      )}

      <QuoteSheet
        ranked={open}
        wedding={w}
        guests={guests}
        needs={needs}
        vendors={vendors}
        bookings={bookings}
        onClose={() => setOpenId(null)}
      />
      <NeedsSheet open={needsOpen} onOpenChange={setNeedsOpen} wedding={w} guests={guests} />
    </div>
  );
}

const isBooked = (q: VenueQuote, bookings: Booking[]) =>
  q.vendorId != null && bookings.some((b) => b.vendorId === q.vendorId && b.stage === "booked");

function QuoteCard({
  r,
  guests,
  vendor,
  booked,
  onOpen,
}: {
  r: RankedQuote;
  guests: number;
  vendor: Vendor | undefined;
  booked: boolean;
  onOpen: () => void;
}) {
  const { quote: q, cost } = r;
  const overCapacity = vendor?.capacity != null && vendor.capacity < guests;
  const hidden = cost.real - cost.subtotal;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "rounded-xl bg-card px-4 py-3.5 text-left elevate transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        r.rank === 1 && "ring-1 ring-emerald-500/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium">{q.venueName}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {r.rank === 1 && <Chip tone="good">Best real price</Chip>}
            {booked && <Chip tone="good">Booked</Chip>}
            {overCapacity && <Chip tone="bad">Holds {vendor!.capacity}</Chip>}
            {cost.questions.length > 0 && <Chip tone="warn">{cost.questions.length} to ask</Chip>}
          </div>
        </div>
        {r.rank != null && <span className="text-xs tabular-nums text-muted-foreground">#{r.rank}</span>}
      </div>

      {cost.priced ? (
        <>
          <div className="mt-3 text-xs text-muted-foreground">Real price</div>
          <div className="text-2xl font-semibold tabular-nums">{money(cost.real)}</div>
          <div className="mt-0.5 text-xs tabular-nums text-muted-foreground">
            {money(cost.perGuest)} per guest
            {r.vsBest != null && r.vsBest > 0 && (
              <span className="text-red-600 dark:text-red-400"> · +{money(r.vsBest)} vs best</span>
            )}
          </div>
          <div className="mt-3 border-t border-border/60 pt-2 text-xs tabular-nums text-muted-foreground">
            Quoted {money(cost.subtotal)}
            {hidden > 0 && <> · {money(hidden)} on top</>}
          </div>
        </>
      ) : (
        <div className="mt-3 text-sm text-muted-foreground">No prices yet — add the quote's lines.</div>
      )}
    </button>
  );
}

function Comparison({ ranked, needs }: { ranked: RankedQuote[]; needs: QuoteItemKey[] }) {
  const update = useUpdate("venueQuotes");
  const cycle = (q: VenueQuote, key: QuoteItemKey) =>
    update.mutate({
      id: q.id,
      patch: { items: { ...q.items, [key]: NEXT_ITEM_STATE[q.items[key] ?? "unknown"] } },
    });

  const row = (label: string, value: (r: RankedQuote) => number | null, opts: { muted?: boolean; skipZero?: boolean } = {}) => {
    if (opts.skipZero && ranked.every((r) => !value(r))) return null;
    return (
      <TableRow>
        <TableCell className={cn("sticky left-0 bg-background", opts.muted && "text-muted-foreground")}>{label}</TableCell>
        {ranked.map((r) => {
          const v = value(r);
          return (
            <TableCell key={r.quote.id} numeric className={cn(opts.muted && "text-muted-foreground")}>
              {r.cost.priced && v != null ? (v === 0 && opts.skipZero ? "—" : money(v)) : "—"}
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  return (
    <section aria-label="Side by side">
      <h2 className="mb-3 text-sm font-semibold">Side by side</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 min-w-44" />
            {ranked.map((r) => (
              <TableHead key={r.quote.id} numeric className="min-w-36">
                {r.quote.venueName}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {row("Quoted lines", (r) => r.cost.subtotal)}
          {row("Minimum spend top-up", (r) => r.cost.minimumTopUp, { skipZero: true, muted: true })}
          {row("Service charge", (r) => r.cost.serviceCharge, { skipZero: true, muted: true })}
          {row("Tax", (r) => r.cost.tax, { skipZero: true, muted: true })}
          {row("Overtime", (r) => r.cost.overtime, { skipZero: true, muted: true })}
          {row("Venue total", (r) => r.cost.quoted + r.cost.overtime)}

          <TableSectionRow>
            <TableCell colSpan={ranked.length + 1} className="text-xs font-medium text-muted-foreground">
              What you'd still pay for elsewhere
            </TableCell>
          </TableSectionRow>
          {needs.map((key) => (
            <TableRow key={key}>
              <TableCell className="sticky left-0 bg-background">{QUOTE_ITEM_LABEL[key]}</TableCell>
              {ranked.map((r) => {
                const gap = r.cost.gaps.find((g) => g.key === key);
                return (
                  <TableCell key={r.quote.id} numeric className="p-1">
                    {gap && (
                      <button
                        type="button"
                        onClick={() => cycle(r.quote, key)}
                        aria-label={`${r.quote.venueName}, ${QUOTE_ITEM_LABEL[key]}: ${QUOTE_ITEM_STATE_LABEL[gap.state]}. Click to change.`}
                        className="w-full rounded px-1 py-1 text-right hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <GapValue gap={gap} />
                      </button>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
          {row("Extras", (r) => r.cost.extras)}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="sticky left-0">Real price</TableCell>
            {ranked.map((r) => (
              <TableCell key={r.quote.id} numeric className={cn(r.rank === 1 && "text-emerald-600 dark:text-emerald-400")}>
                {r.cost.priced ? money(r.cost.real) : "—"}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="sticky left-0 font-normal text-muted-foreground">Per guest</TableCell>
            {ranked.map((r) => (
              <TableCell key={r.quote.id} numeric className="font-normal text-muted-foreground">
                {r.cost.priced ? money(r.cost.perGuest) : "—"}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </section>
  );
}
