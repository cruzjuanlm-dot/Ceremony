import { useState, type FormEvent } from "react";
import { ChevronRight, Plus, Star } from "lucide-react";

import { Button } from "@libretto-ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@libretto-ui/dialog";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { EmptyState } from "~/components/kit";
import { StageChip } from "~/components/status";
import { useInsert, useRows, useUpdate, useWeddingRows } from "~/data/hooks";
import type { Booking, BookingStage, BudgetLine, Payment, SubEvent, Vendor, Wedding } from "~/data/types";
import { bookingBalance } from "~/lib/finance";
import { money, time12 } from "~/lib/format";
import { STAGES, STAGE_LABEL, subEventIdForKind, subEventKindForVendor, VENDOR_CATEGORY_LABEL } from "~/lib/wedding";
import { cn } from "~/shared/libretto";

import { CellAmount, CellText, GhostSelect } from "./fields";
import { matchesSubEvent, SubEventFilter, SubEventSelect } from "./sub-events";
import { parseAmount, VENDOR_BUDGET_CATEGORY } from "./wedding-helpers";
import { TipEnvelopes } from "./vendors/tip-envelopes";

const BOARD: BookingStage[] = ["researching", "contacted", "quoted", "booked"];
const STAGE_OPTIONS = STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }));

export function VendorsTab({ wedding: w }: { wedding: Wedding }) {
  const bookings = useWeddingRows("bookings", w.id);
  const subEvents = useWeddingRows("subEvents", w.id);
  const payments = useWeddingRows("payments", w.id);
  const lines = useWeddingRows("budgetLines", w.id);
  const vendors = useRows("vendors");
  const [showDeclined, setShowDeclined] = useState(false);
  const [eventFilter, setEventFilter] = useState("all");

  const vendorOf = (b: Booking) => vendors.find((v) => v.id === b.vendorId);
  const visible = bookings.filter((b) => matchesSubEvent(b.subEventId, eventFilter));
  const declined = visible.filter((b) => b.stage === "declined");

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">
          Vendor team{" "}
          <span className="font-normal text-muted-foreground">
            · {bookings.filter((b) => b.stage === "booked").length} of {bookings.length - declined.length} booked
          </span>
        </h2>
        <AddVendorButton wedding={w} vendors={vendors} bookings={bookings} subEvents={subEvents} eventFilter={eventFilter} />
      </div>

      <SubEventFilter events={subEvents} value={eventFilter} onChange={setEventFilter} />

      {bookings.length === 0 ? (
        <EmptyState title="No vendors yet" action={<AddVendorButton wedding={w} vendors={vendors} bookings={bookings} subEvents={subEvents} eventFilter={eventFilter} />}>
          Add the venue first — most other vendors work around its date.
        </EmptyState>
      ) : visible.filter((b) => b.stage !== "declined").length === 0 && declined.length === 0 ? (
        <EmptyState title="No vendors for this sub-event">
          Set Event on a vendor under All, or add one while this filter is on.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {BOARD.filter((stage) => visible.some((b) => b.stage === stage)).map((stage) => (
            <section key={stage} aria-label={STAGE_LABEL[stage]}>
              <div className="mb-2 flex items-center gap-2">
                <StageChip stage={stage} />
                <span className="text-xs tabular-nums text-muted-foreground">
                  {visible.filter((b) => b.stage === stage).length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {visible
                  .filter((b) => b.stage === stage)
                  .map((b) => {
                    const v = vendorOf(b);
                    return v ? (
                      <BookingCard key={b.id} booking={b} vendor={v} payments={payments} lines={lines} wedding={w} subEvents={subEvents} />
                    ) : null;
                  })}
              </div>
            </section>
          ))}
        </div>
      )}

      {declined.length > 0 && (
        <section>
          <button
            type="button"
            aria-expanded={showDeclined}
            onClick={() => setShowDeclined((s) => !s)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", showDeclined && "rotate-90")} />
            Declined ({declined.length})
          </button>
          {showDeclined && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {declined.map((b) => {
                const v = vendorOf(b);
                return v ? <BookingCard key={b.id} booking={b} vendor={v} payments={payments} lines={lines} wedding={w} subEvents={subEvents} /> : null;
              })}
            </div>
          )}
        </section>
      )}

      <TipEnvelopes wedding={w} />
    </div>
  );
}

function BookingCard({
  booking: b,
  vendor: v,
  payments,
  lines,
  wedding: w,
  subEvents,
}: {
  booking: Booking;
  vendor: Vendor;
  payments: Payment[];
  lines: BudgetLine[];
  wedding: Wedding;
  subEvents: SubEvent[];
}) {
  const update = useUpdate("bookings");
  const insertLine = useInsert("budgetLines");
  const save = (patch: Partial<Booking>) => update.mutate({ id: b.id, patch });
  const bal = bookingBalance(b, payments);
  const isBooked = b.stage === "booked";
  const linked = lines.some((l) => l.bookingId === b.id);

  return (
    <article className={cn("rounded-lg border bg-card p-3 text-sm", b.stage === "declined" && "opacity-70")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1 truncate font-medium">
            {v.name}
            {v.preferred && <Star className="h-3 w-3 shrink-0 fill-current text-amber-500" aria-label="Preferred vendor" />}
          </div>
          <div className="text-xs text-muted-foreground">{VENDOR_CATEGORY_LABEL[v.category]}</div>
        </div>
      </div>

      <dl className="mt-2 grid grid-cols-[auto_1fr] items-center gap-x-3 text-xs">
            {subEvents.length > 0 && (
              <>
                <dt className="text-muted-foreground">Event</dt>
                <dd>
                  <SubEventSelect
                    events={subEvents}
                    value={b.subEventId}
                    ariaLabel={`${v.name} sub-event`}
                    onChange={(subEventId) => save({ subEventId })}
                    className="-ml-2 [&_select]:h-7 [&_select]:text-xs"
                  />
                </dd>
              </>
            )}
            <dt className="text-muted-foreground">{isBooked ? "Contract" : "Quote"}</dt>
        <dd>
          <CellAmount
            ariaLabel={`${v.name} amount`}
            value={b.amount}
            onCommit={(n) => save({ amount: n })}
            className="h-7 text-xs"
          />
        </dd>
        {isBooked && (
          <>
            <dt className="text-muted-foreground">Arrives</dt>
            <dd>
              <CellText
                type="time"
                ariaLabel={`${v.name} arrival time`}
                value={b.arrivalTime ?? ""}
                display={time12(b.arrivalTime)}
                onCommit={(t) => save({ arrivalTime: t || null })}
                className="h-7 text-right text-xs"
              />
            </dd>
            <dt className="text-muted-foreground">Balance</dt>
            <dd className="px-2 py-1 text-right tabular-nums">
              {b.amount == null ? (
                "—"
              ) : bal.balance <= 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">Paid in full</span>
              ) : (
                <>
                  {money(bal.balance)}
                  {bal.paid > 0 && <span className="text-muted-foreground"> · {money(bal.paid)} paid</span>}
                </>
              )}
            </dd>
          </>
        )}
      </dl>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
        <GhostSelect
          ariaLabel={`${v.name} stage`}
          value={b.stage}
          options={STAGE_OPTIONS}
          onChange={(s) => save({ stage: s })}
          className="-ml-2 w-32 [&_select]:h-7 [&_select]:text-xs"
        />
        {isBooked && !linked && b.amount != null && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={insertLine.isPending}
            onClick={() =>
              insertLine.mutate({
                weddingId: w.id,
                category: VENDOR_BUDGET_CATEGORY[v.category],
                description: v.name,
                estimate: b.amount,
                actual: b.amount,
                bookingId: b.id,
                subEventId: b.subEventId,
                paidBy: "couple",
                serviceChargePct: null,
                taxPct: null,
              })
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add to budget
          </Button>
        )}
      </div>
    </article>
  );
}

function AddVendorButton({
  wedding: w,
  vendors,
  bookings,
  subEvents,
  eventFilter,
}: {
  wedding: Wedding;
  vendors: Vendor[];
  bookings: Booking[];
  subEvents: SubEvent[];
  eventFilter: string;
}) {
  const [open, setOpen] = useState(false);
  const insert = useInsert("bookings");
  const [vendorId, setVendorId] = useState("");
  const [stage, setStage] = useState<BookingStage>("contacted");
  const [amount, setAmount] = useState("");

  const taken = new Set(bookings.map((b) => b.vendorId));
  const available = vendors
    .filter((v) => !taken.has(v.id))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!vendorId) return;
    const vendor = vendors.find((v) => v.id === vendorId);
    const fromFilter = eventFilter !== "all" && eventFilter !== "none" ? eventFilter : null;
    await insert.mutateAsync({
      weddingId: w.id,
      vendorId,
      stage,
      amount: parseAmount(amount),
      arrivalTime: null,
      subEventId: fromFilter ?? (vendor ? subEventIdForKind(subEventKindForVendor(vendor.category), subEvents) : null),
      notes: "",
    });
    setOpen(false);
    setVendorId("");
    setAmount("");
    setStage("contacted");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add vendor</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4">
          <div className="grid gap-1.5">
            <Label>Vendor</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger aria-label="Vendor">
                <SelectValue placeholder={available.length ? "Choose from your directory" : "Every vendor is already on this wedding"} />
              </SelectTrigger>
              <SelectContent>
                {available.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} · {VENDOR_CATEGORY_LABEL[v.category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Stage</Label>
              <Select value={stage} onValueChange={(s) => setStage(s as BookingStage)}>
                <SelectTrigger aria-label="Stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.filter((s) => s !== "declined").map((s) => (
                    <SelectItem key={s} value={s}>
                      {STAGE_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="av-amount">Quoted amount</Label>
              <Input id="av-amount" inputMode="decimal" placeholder="$" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!vendorId || insert.isPending}>
              Add vendor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
