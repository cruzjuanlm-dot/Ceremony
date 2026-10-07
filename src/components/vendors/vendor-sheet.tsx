import { Link, useNavigate } from "@tanstack/react-router";
import { Star } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@libretto-ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libretto-ui/table";

import { Chip, CoupleName, toneText } from "~/components/kit";
import { PaymentChip, StageChip } from "~/components/status";
import { useRows, useUpdate, useWorkspace } from "~/data/hooks";
import type { Vendor, VendorCategory } from "~/data/types";
import { bookingBalance, paymentState, todayIso } from "~/lib/finance";
import { dateShort, money } from "~/lib/format";
import { VENDOR_CATEGORY_LABEL } from "~/lib/wedding";
import { cn } from "~/shared/libretto";

import { InlineNotes, InlineSelect, InlineText } from "./inline-field";
import { nextPayment } from "./vendor-stats";

const CATEGORY_OPTIONS = (Object.keys(VENDOR_CATEGORY_LABEL) as VendorCategory[]).map((k) => ({
  value: k,
  label: VENDOR_CATEGORY_LABEL[k],
}));

export function VendorSheet({ vendorId, onClose }: { vendorId: string | null; onClose: () => void }) {
  const vendors = useRows("vendors");
  const vendor = vendors.find((v) => v.id === vendorId) ?? null;
  return (
    <Sheet open={!!vendor} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">{vendor && <VendorDetail vendor={vendor} />}</SheetContent>
    </Sheet>
  );
}

function VendorDetail({ vendor }: { vendor: Vendor }) {
  const ws = useWorkspace();
  const update = useUpdate("vendors");
  const bookings = useRows("bookings").filter((b) => b.vendorId === vendor.id);
  const weddings = useRows("weddings");
  const payments = useRows("payments");
  const navigate = useNavigate();
  const today = todayIso();
  const save = (patch: Partial<Vendor>) => update.mutate({ id: vendor.id, patch });
  const isVenue = vendor.category === "venue";

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <SheetHeader className="space-y-1 pr-8 text-left">
        <div className="flex items-center gap-2">
          <SheetTitle className="text-xl">{vendor.name}</SheetTitle>
          {ws.plan === "pro" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-pressed={vendor.preferred}
              aria-label={vendor.preferred ? "Remove from preferred" : "Mark preferred"}
              onClick={() => save({ preferred: !vendor.preferred })}
            >
              <Star className={cn("h-4 w-4", vendor.preferred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip>{VENDOR_CATEGORY_LABEL[vendor.category]}</Chip>
          {vendor.preferred && ws.plan === "pro" && <Chip tone="brand">Preferred</Chip>}
        </div>
      </SheetHeader>

      <div className="grid gap-1">
        <InlineText label="Name" value={vendor.name} onCommit={(v) => v && save({ name: v })} />
        <InlineSelect label="Category" value={vendor.category} options={CATEGORY_OPTIONS} onCommit={(v) => save({ category: v })} />
        <InlineText label="Contact" value={vendor.contactName} onCommit={(v) => save({ contactName: v })} />
        <InlineText label="Email" type="email" value={vendor.email} onCommit={(v) => save({ email: v })} />
        <InlineText label="Phone" type="tel" value={vendor.phone} onCommit={(v) => save({ phone: v })} />
        <InlineText label="City" value={vendor.city} onCommit={(v) => save({ city: v })} />
        <InlineText label="Instagram" value={vendor.instagram} onCommit={(v) => save({ instagram: v })} />
        {isVenue && (
          <>
            <InlineText
              label="Capacity"
              type="number"
              value={vendor.capacity != null ? String(vendor.capacity) : ""}
              onCommit={(v) => save({ capacity: v ? Number(v) || undefined : undefined })}
            />
            <InlineSelect
              label="Setting"
              value={vendor.indoorOutdoor ?? ""}
              options={[
                { value: "indoor", label: "Indoor" },
                { value: "outdoor", label: "Outdoor" },
                { value: "both", label: "Indoor & outdoor" },
              ]}
              onCommit={(v) => save({ indoorOutdoor: v })}
            />
            <InlineText label="Address" value={vendor.address ?? ""} onCommit={(v) => save({ address: v })} />
          </>
        )}
        <div className="mt-2">
          <InlineNotes label="Notes" value={vendor.notes} onCommit={(v) => save({ notes: v })} />
        </div>
      </div>

      <section>
        <h3 className="mb-1 text-sm font-semibold">{ws.plan === "pro" ? "Bookings" : "Our booking"}</h3>
        {bookings.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">Not on any wedding yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wedding</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead numeric>Amount</TableHead>
                <TableHead numeric>Balance</TableHead>
                <TableHead>Next payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => {
                const w = weddings.find((x) => x.id === b.weddingId);
                const bal = bookingBalance(b, payments);
                const next = nextPayment(b.id, payments);
                const state = next ? paymentState(next, today) : null;
                return (
                  <TableRow
                    key={b.id}
                    className="cursor-pointer"
                    onClick={() =>
                      w && navigate({ to: "/weddings/$weddingId", params: { weddingId: w.id }, search: { tab: "vendors" } as never })
                    }
                  >
                    <TableCell>
                      {w ? (
                        <Link
                          to="/weddings/$weddingId"
                          params={{ weddingId: w.id }}
                          search={{ tab: "vendors" } as never}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          <CoupleName>{w.title}</CoupleName>
                        </Link>
                      ) : (
                        "—"
                      )}
                      <div className="text-xs text-muted-foreground">{dateShort(w?.date)}</div>
                    </TableCell>
                    <TableCell>
                      <StageChip stage={b.stage} />
                    </TableCell>
                    <TableCell numeric>{money(b.amount)}</TableCell>
                    <TableCell numeric>{b.stage === "booked" && b.amount != null ? money(bal.balance) : "—"}</TableCell>
                    <TableCell>
                      {next && state ? (
                        <div className="flex items-center gap-2">
                          <span className={cn("tabular-nums", state === "overdue" && toneText("bad"))}>
                            {money(next.amount)} · {dateShort(next.dueDate)}
                          </span>
                          {state !== "scheduled" && <PaymentChip state={state} />}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
