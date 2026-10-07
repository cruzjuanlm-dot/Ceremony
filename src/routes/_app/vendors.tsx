import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Star } from "lucide-react";

import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";
import { Switch } from "@libretto-ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libretto-ui/table";

import { Hero, HeroFigure } from "~/components/financials/hero";
import { EmptyState, Meter, toneText } from "~/components/kit";
import { StageChip } from "~/components/status";
import { NewVendorButton } from "~/components/vendors/new-vendor-dialog";
import { VendorSheet } from "~/components/vendors/vendor-sheet";
import { endOfMonthIso, vendorStats } from "~/components/vendors/vendor-stats";
import { useRows, useWorkspace } from "~/data/hooks";
import type { Booking, BookingStage, Payment, VendorCategory } from "~/data/types";
import { paymentTotals, todayIso } from "~/lib/finance";
import { dateShort, money } from "~/lib/format";
import { STAGE_LABEL, VENDOR_CATEGORY_LABEL } from "~/lib/wedding";
import { cn, PageHeader } from "~/shared/libretto";

export const Route = createFileRoute("/_app/vendors")({
  component: VendorsPage,
});

function VendorsPage() {
  const ws = useWorkspace();
  const vendors = useRows("vendors");
  const bookings = useRows("bookings");
  const payments = useRows("payments");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<VendorCategory | "all">("all");
  const [preferredOnly, setPreferredOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const pro = ws.plan === "pro";

  const categories = [...new Set(vendors.map((v) => v.category))].sort((a, b) =>
    VENDOR_CATEGORY_LABEL[a].localeCompare(VENDOR_CATEGORY_LABEL[b]),
  );
  const q = query.trim().toLowerCase();
  const rows = vendors
    .filter((v) => category === "all" || v.category === category)
    .filter((v) => !pro || !preferredOnly || v.preferred)
    .filter(
      (v) =>
        !q ||
        [v.name, v.contactName, v.city, v.email, VENDOR_CATEGORY_LABEL[v.category]].some((s) => s.toLowerCase().includes(q)),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={pro ? "Vendors" : "Our vendors"}
        description={`${vendors.length} ${vendors.length === 1 ? "vendor" : "vendors"}`}
        actions={<NewVendorButton onCreated={setOpenId} />}
      />

      {pro ? <ProHero payments={payments} /> : <DiyHero bookings={bookings} />}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search vendors"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory | "all")}>
          <SelectTrigger className="w-44" aria-label="Category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {VENDOR_CATEGORY_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pro && (
          <div className="flex items-center gap-2">
            <Switch id="v-pref" checked={preferredOnly} onCheckedChange={setPreferredOnly} />
            <Label htmlFor="v-pref" className="font-normal">
              Preferred only
            </Label>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState title={vendors.length ? "No vendors match" : "No vendors yet"} action={!vendors.length && <NewVendorButton onCreated={setOpenId} />}>
          {vendors.length ? "Try a different search or category." : "Add the photographers, caterers and venues you work with."}
        </EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Phone / email</TableHead>
              {pro ? <TableHead numeric>Weddings</TableHead> : <TableHead>Stage</TableHead>}
              <TableHead numeric>Contracted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((v) => {
              const s = vendorStats(v, bookings, payments);
              const own = s.bookings[0];
              return (
                <TableRow key={v.id} className="cursor-pointer" onClick={() => setOpenId(v.id)}>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      {v.name}
                      {pro && v.preferred && (
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-label="Preferred" />
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{VENDOR_CATEGORY_LABEL[v.category]}</TableCell>
                  <TableCell>{v.contactName || "—"}</TableCell>
                  <TableCell>{v.city || "—"}</TableCell>
                  <TableCell>
                    <div className="tabular-nums">{v.phone || "—"}</div>
                    {v.email && <div className="text-xs text-muted-foreground">{v.email}</div>}
                  </TableCell>
                  {pro ? (
                    <TableCell numeric>{s.bookedCount || <span className="text-muted-foreground">—</span>}</TableCell>
                  ) : (
                    <TableCell>{own ? <StageChip stage={own.stage} /> : <span className="text-muted-foreground">—</span>}</TableCell>
                  )}
                  <TableCell numeric>{s.hasContract ? money(s.contracted) : <span className="text-muted-foreground">—</span>}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <VendorSheet vendorId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

/** Pro hero: the one thing a planner needs from the directory — vendor money due this month. */
function ProHero({ payments }: { payments: Payment[] }) {
  const today = todayIso();
  const eom = endOfMonthIso(today);
  const dueThisMonth = payments.filter((p) => p.direction === "outgoing" && !p.paidDate && p.dueDate <= eom);
  const t = paymentTotals(dueThisMonth, today);
  return (
    <Hero>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <HeroFigure
          label="Due to vendors this month"
          value={money(t.outstanding)}
          sub={`${dueThisMonth.length} ${dueThisMonth.length === 1 ? "payment" : "payments"} through ${dateShort(eom)}`}
        />
        {t.overdueCount > 0 && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Already overdue</div>
            <div className={cn("text-xl font-semibold tabular-nums", toneText("bad"))}>{money(t.overdue)}</div>
            <div className="text-xs text-muted-foreground">
              {t.overdueCount} {t.overdueCount === 1 ? "payment" : "payments"}
            </div>
          </div>
        )}
      </div>
    </Hero>
  );
}

const PIPELINE: BookingStage[] = ["researching", "contacted", "quoted", "booked"];

/** DIY hero: where our vendor search stands. */
function DiyHero({ bookings }: { bookings: Booking[] }) {
  const live = bookings.filter((b) => b.stage !== "declined");
  const count = (s: BookingStage) => live.filter((b) => b.stage === s).length;
  const booked = count("booked");
  return (
    <Hero>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {PIPELINE.map((s) => (
          <HeroFigure
            key={s}
            label={STAGE_LABEL[s]}
            value={count(s)}
            valueClassName={s === "booked" ? toneText("good") : count(s) === 0 ? "text-muted-foreground" : undefined}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Meter value={booked} max={live.length} tone="good" label="Vendors booked" />
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {booked} of {live.length} booked
        </span>
      </div>
    </Hero>
  );
}
