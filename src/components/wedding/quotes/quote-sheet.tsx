import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@libretto-ui/alert-dialog";
import { Button } from "@libretto-ui/button";
import { SegmentedControl } from "@libretto-ui/segmented-control";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@libretto-ui/sheet";
import { Switch } from "@libretto-ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libretto-ui/table";

import { Chip } from "~/components/kit";
import { useInsert, useRemove, useUpdate } from "~/data/hooks";
import type {
  Booking,
  QuoteItemKey,
  QuoteItemState,
  QuoteLine,
  QuoteLineKind,
  Vendor,
  VenueQuote,
  Wedding,
} from "~/data/types";
import { quoteLineTotal, type RankedQuote, type ResolvedNeed } from "~/lib/finance";
import { dateShort, money } from "~/lib/format";
import { QUOTE_ITEM_LABEL, QUOTE_ITEM_STATE_LABEL, QUOTE_LINE_KIND_LABEL } from "~/lib/wedding";
import { cellActionClass, cn } from "~/shared/libretto";

import { CellAmount, CellText, GhostSelect, InlineFact, InlineTextarea } from "../fields";
import { parseAmount } from "../wedding-helpers";
import { newLineId, questionLabel } from "./quote-helpers";

const KIND_OPTIONS = (Object.keys(QUOTE_LINE_KIND_LABEL) as QuoteLineKind[]).map((k) => ({
  value: k,
  label: QUOTE_LINE_KIND_LABEL[k],
}));
const BASIS_OPTIONS = [
  { value: "flat", label: "Flat" },
  { value: "per_guest", label: "Per guest" },
] as const;
const STATE_OPTIONS = (["included", "not_included", "unknown"] as QuoteItemState[]).map((s) => ({
  value: s,
  label: QUOTE_ITEM_STATE_LABEL[s],
}));

interface Props {
  ranked: RankedQuote | null;
  wedding: Wedding;
  guests: number;
  needs: { hoursNeeded: number | null; items: ResolvedNeed[] };
  vendors: Vendor[];
  bookings: Booking[];
  onClose: () => void;
}

export function QuoteSheet(props: Props) {
  return (
    <Sheet open={!!props.ranked} onOpenChange={(o) => !o && props.onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {props.ranked && <QuoteDetail {...props} ranked={props.ranked} />}
      </SheetContent>
    </Sheet>
  );
}

function QuoteDetail({ ranked: r, wedding: w, guests, needs, vendors, bookings, onClose }: Props & { ranked: RankedQuote }) {
  const { quote: q, cost } = r;
  const update = useUpdate("venueQuotes");
  const save = (patch: Partial<VenueQuote>) => update.mutate({ id: q.id, patch });
  const saveLine = (id: string, patch: Partial<QuoteLine>) =>
    save({ lines: q.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  const vendor = vendors.find((v) => v.id === q.vendorId);
  const booked = q.vendorId != null && bookings.some((b) => b.vendorId === q.vendorId && b.stage === "booked");
  const overCapacity = vendor?.capacity != null && vendor.capacity < guests;
  const numFact = (label: string, value: number | null, display: string, key: keyof VenueQuote) => (
    <InlineFact
      label={label}
      display={value == null ? "—" : display}
      value={value == null ? "" : String(value)}
      type="number"
      onCommit={(v) => save({ [key]: parseAmount(v) })}
    />
  );

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <SheetHeader className="space-y-1 pr-8 text-left">
        <SheetTitle className="sr-only">{q.venueName}</SheetTitle>
        <CellText
          ariaLabel="Venue name"
          value={q.venueName}
          allowEmpty={false}
          onCommit={(v) => save({ venueName: v })}
          className="-ml-2 h-9 text-xl font-semibold"
        />
        <div className="flex flex-wrap gap-1.5">
          {r.rank === 1 && <Chip tone="good">Best real price</Chip>}
          {booked && <Chip tone="good">Booked</Chip>}
          {!vendor && <Chip>Not in directory</Chip>}
          {overCapacity && <Chip tone="bad">Holds {vendor!.capacity} — you're comparing at {guests}</Chip>}
        </div>
      </SheetHeader>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <InlineFact
          label="Received"
          type="date"
          display={dateShort(q.receivedDate)}
          value={q.receivedDate ?? ""}
          onCommit={(v) => save({ receivedDate: v || null })}
        />
        <InlineFact
          label="Valid until"
          type="date"
          display={dateShort(q.validUntil)}
          value={q.validUntil ?? ""}
          onCommit={(v) => save({ validUntil: v || null })}
        />
        {numFact("Hours included", q.hoursIncluded, `${q.hoursIncluded} hours`, "hoursIncluded")}
        {numFact("Overtime / hour", q.overtimePerHour, money(q.overtimePerHour), "overtimePerHour")}
        {numFact("F&B minimum", q.fbMinimum, money(q.fbMinimum), "fbMinimum")}
        {numFact("Service charge", q.serviceChargePct, `${q.serviceChargePct}%`, "serviceChargePct")}
        {numFact("Tax", q.taxPct, `${q.taxPct}%`, "taxPct")}
        <div className="min-w-0">
          <label htmlFor="vq-tax-svc" className="block px-1 text-xs text-muted-foreground">
            Tax on service charge
          </label>
          <Switch
            id="vq-tax-svc"
            className="ml-1 mt-1.5"
            checked={q.taxOnServiceCharge}
            onCheckedChange={(c) => save({ taxOnServiceCharge: c })}
          />
        </div>
      </div>

      <section aria-label="Quote lines">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold">What they quoted</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              save({ lines: [...q.lines, { id: newLineId(), label: "", kind: "rental", amount: null, perGuest: false }] })
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add line
          </Button>
        </div>
        {q.lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add each line of the quote: site fee, packages, per-guest menus, fees.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line</TableHead>
                <TableHead>Type</TableHead>
                <TableHead numeric>Price</TableHead>
                <TableHead>Basis</TableHead>
                <TableHead numeric>At {guests}</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.lines.map((l, i) => (
                <TableRow key={l.id}>
                  <TableCell className="min-w-40 py-1">
                    <CellText
                      ariaLabel={`Line ${i + 1} name`}
                      value={l.label}
                      placeholder="Site fee, dinner package…"
                      onCommit={(v) => saveLine(l.id, { label: v })}
                      className="h-7"
                    />
                  </TableCell>
                  <TableCell className="py-1">
                    <GhostSelect
                      ariaLabel={`${l.label || `Line ${i + 1}`} type`}
                      value={l.kind}
                      options={KIND_OPTIONS}
                      onChange={(kind) => saveLine(l.id, { kind })}
                      className="w-32 [&_select]:h-7"
                    />
                  </TableCell>
                  <TableCell numeric className="py-1">
                    <CellAmount
                      ariaLabel={`${l.label || `Line ${i + 1}`} price`}
                      value={l.amount}
                      onCommit={(amount) => saveLine(l.id, { amount })}
                      className="h-7 w-24"
                    />
                  </TableCell>
                  <TableCell className="py-1">
                    <GhostSelect
                      ariaLabel={`${l.label || `Line ${i + 1}`} basis`}
                      value={l.perGuest ? "per_guest" : "flat"}
                      options={BASIS_OPTIONS}
                      onChange={(b) => saveLine(l.id, { perGuest: b === "per_guest" })}
                      className="w-28 [&_select]:h-7"
                    />
                  </TableCell>
                  <TableCell numeric>{money(quoteLineTotal(l, guests))}</TableCell>
                  <TableCell className="py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-7 w-7", cellActionClass)}
                      aria-label={`Remove ${l.label || `line ${i + 1}`}`}
                      onClick={() => save({ lines: q.lines.filter((x) => x.id !== l.id) })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section aria-label="Price breakdown" className="rounded-lg border bg-card px-4 py-3 text-sm">
        <dl className="grid grid-cols-[1fr_auto] gap-y-1 tabular-nums">
          <Line label="Quoted lines" value={cost.subtotal} />
          {cost.minimumTopUp > 0 && <Line muted label={`Top-up to the ${money(q.fbMinimum)} F&B minimum`} value={cost.minimumTopUp} />}
          {cost.serviceCharge > 0 && <Line muted label={`Service charge (${q.serviceChargePct}%)`} value={cost.serviceCharge} />}
          {cost.tax > 0 && <Line muted label={`Tax (${q.taxPct}%)`} value={cost.tax} />}
          {cost.overtime > 0 && (
            <Line muted label={`Overtime (${cost.overtimeHours} h × ${money(q.overtimePerHour)})`} value={cost.overtime} />
          )}
          <Line strong label="Venue total" value={cost.quoted + cost.overtime} />
          <Line muted label="Extras you'd pay elsewhere" value={cost.extras} />
          <Line strong label="Real price" value={cost.real} />
          <dt className="text-muted-foreground">Per guest</dt>
          <dd className="text-right text-muted-foreground">{money(cost.perGuest)}</dd>
        </dl>
      </section>

      <section aria-label="What's included">
        <h3 className="mb-2 text-sm font-semibold">What's included</h3>
        <ul className="grid gap-1">
          {needs.items
            .filter((n) => n.needed)
            .map((n) => (
              <ItemRow key={n.key} quote={q} need={n} onSave={save} />
            ))}
        </ul>
      </section>

      {cost.questions.length > 0 && (
        <section aria-label="Questions for the venue">
          <h3 className="mb-2 text-sm font-semibold">Ask {q.venueName}</h3>
          <ul className="grid list-disc gap-1 pl-5 text-sm">
            {cost.questions.map((x, i) => (
              <li key={i}>{questionLabel(x)}</li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Notes">
        <h3 className="mb-1 text-sm font-semibold">Notes</h3>
        <InlineTextarea ariaLabel="Notes" placeholder="Rain plan, curfew, exclusive vendors…" value={q.notes} onCommit={(v) => save({ notes: v })} />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        <DeleteQuote quote={q} onDeleted={onClose} />
        {!booked && cost.priced && <BookVenue quote={q} amount={Math.round(cost.quoted + cost.overtime)} extras={cost.extras} wedding={w} bookings={bookings} />}
      </div>
    </div>
  );
}

function Line({ label, value, muted, strong }: { label: ReactNode; value: number; muted?: boolean; strong?: boolean }) {
  return (
    <>
      <dt className={cn(muted && "text-muted-foreground", strong && "border-t border-border/60 pt-1 font-medium")}>{label}</dt>
      <dd className={cn("text-right", muted && "text-muted-foreground", strong && "border-t border-border/60 pt-1 font-medium")}>
        {money(value)}
      </dd>
    </>
  );
}

function ItemRow({ quote: q, need: n, onSave }: { quote: VenueQuote; need: ResolvedNeed; onSave: (p: Partial<VenueQuote>) => void }) {
  const state = q.items[n.key] ?? "unknown";
  const override = q.gapOverrides[n.key];
  const setOverride = (v: number | null) => {
    const next = { ...q.gapOverrides };
    if (v == null || v === n.total) delete next[n.key as QuoteItemKey];
    else next[n.key] = v;
    onSave({ gapOverrides: next });
  };
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md px-1 py-1 hover:bg-muted/40">
      <span className="min-w-36 flex-1 text-sm">{QUOTE_ITEM_LABEL[n.key]}</span>
      <SegmentedControl
        aria-label={`${QUOTE_ITEM_LABEL[n.key]} — included?`}
        value={state}
        onValueChange={(s) => onSave({ items: { ...q.items, [n.key]: s } })}
        options={STATE_OPTIONS}
      />
      <span className="w-24 text-right text-sm">
        {state === "included" ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <CellAmount
            ariaLabel={`${QUOTE_ITEM_LABEL[n.key]} cost elsewhere`}
            value={override ?? n.total}
            onCommit={setOverride}
            className={cn("h-7", state === "unknown" && "text-amber-600 dark:text-amber-400")}
          />
        )}
      </span>
    </li>
  );
}

function DeleteQuote({ quote: q, onDeleted }: { quote: VenueQuote; onDeleted: () => void }) {
  const remove = useRemove("venueQuotes");
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Trash2 className="mr-1.5 h-4 w-4" />
          Delete quote
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete the {q.venueName} quote?</AlertDialogTitle>
          <AlertDialogDescription>Its lines and answers go with it.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              await remove.mutateAsync(q.id);
              onDeleted();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Book: the venue joins the directory (if it isn't there), its booking on this wedding goes
 * to Booked at the venue total, and it becomes the wedding's venue. The extras stay off the
 * contract — they're other vendors' money.
 */
function BookVenue({
  quote: q,
  amount,
  extras,
  wedding: w,
  bookings,
}: {
  quote: VenueQuote;
  amount: number;
  extras: number;
  wedding: Wedding;
  bookings: Booking[];
}) {
  const insertVendor = useInsert("vendors");
  const insertBooking = useInsert("bookings");
  const updateBooking = useUpdate("bookings");
  const updateQuote = useUpdate("venueQuotes");
  const updateWedding = useUpdate("weddings");

  async function book() {
    let vendorId = q.vendorId;
    if (!vendorId) {
      const v = await insertVendor.mutateAsync({
        name: q.venueName,
        category: "venue",
        contactName: "",
        email: "",
        phone: "",
        city: w.city,
        instagram: "",
        preferred: false,
        notes: q.notes,
      });
      vendorId = v.id;
      await updateQuote.mutateAsync({ id: q.id, patch: { vendorId } });
    }
    const existing = bookings.find((b) => b.vendorId === vendorId);
    if (existing) await updateBooking.mutateAsync({ id: existing.id, patch: { stage: "booked", amount } });
    else
      await insertBooking.mutateAsync({ weddingId: w.id, vendorId, stage: "booked", amount, arrivalTime: null, notes: "" });
    await updateWedding.mutateAsync({ id: w.id, patch: { venueId: vendorId } });
    toast.success(`${q.venueName} booked at ${money(amount)}`);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm">Book this venue</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Book {q.venueName}?</AlertDialogTitle>
          <AlertDialogDescription>
            It becomes this wedding's venue, booked at {money(amount)}.
            {extras > 0 && ` The ${money(extras)} in extras is for other vendors — add those as you book them.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={book}>Book venue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
