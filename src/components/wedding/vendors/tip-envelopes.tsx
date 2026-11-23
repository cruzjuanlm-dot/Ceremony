import { Button } from "@libretto-ui/button";
import { Checkbox } from "@libretto-ui/checkbox";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow, TableShell } from "@libretto-ui/table";

import { useInsert, useRemove, useRows, useUpdate, useWeddingRows, useWorkspace } from "~/data/hooks";
import type { Gratuity, TipHandover, Wedding } from "~/data/types";
import { suggestedTip, sumKnown } from "~/lib/finance";
import { money } from "~/lib/format";
import { TIP_HANDOVER_LABEL, VENDOR_CATEGORY_LABEL } from "~/lib/wedding";
import { cellActionClass } from "~/shared/libretto";

import { CellAmount, GhostSelect } from "../fields";

const HANDOVER_ORDER: TipHandover[] = ["planner", "couple", "family"];

/**
 * Tip envelopes for one wedding. Dollars are a Gratuities budget line (estimate = planned
 * envelope, actual = what was handed over). This table keeps the cash flag and who hands it over.
 */
export function TipEnvelopes({ wedding: w }: { wedding: Wedding }) {
  const ws = useWorkspace();
  const bookings = useWeddingRows("bookings", w.id);
  const lines = useWeddingRows("budgetLines", w.id);
  const gratuities = useWeddingRows("gratuities", w.id);
  const vendors = useRows("vendors");
  const insertLine = useInsert("budgetLines");
  const updateLine = useUpdate("budgetLines");
  const removeLine = useRemove("budgetLines");
  const insertG = useInsert("gratuities");
  const updateG = useUpdate("gratuities");

  const defaultWho: TipHandover = ws.plan === "diy" ? "couple" : "planner";
  const whoOptions = HANDOVER_ORDER.map((value) => ({
    value,
    label: ws.plan === "diy" && value === "couple" ? "Us" : TIP_HANDOVER_LABEL[value],
  }));

  const rows = bookings
    .filter((b) => b.stage === "booked")
    .map((b) => {
      const vendor = vendors.find((v) => v.id === b.vendorId);
      if (!vendor) return null;
      const gratuity = gratuities.find((g) => g.bookingId === b.id) ?? null;
      const line = gratuity?.budgetLineId ? lines.find((l) => l.id === gratuity.budgetLineId) ?? null : null;
      return {
        booking: b,
        vendor,
        gratuity,
        line,
        suggested: suggestedTip(b.amount, vendor.category),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null)
    .sort(
      (a, b) =>
        VENDOR_CATEGORY_LABEL[a.vendor.category].localeCompare(VENDOR_CATEGORY_LABEL[b.vendor.category]) ||
        a.vendor.name.localeCompare(b.vendor.name),
    );

  const pending =
    insertLine.isPending || updateLine.isPending || removeLine.isPending || insertG.isPending || updateG.isPending;

  async function ensureMeta(row: (typeof rows)[number], patch: Partial<Gratuity>) {
    if (row.gratuity) {
      await updateG.mutateAsync({ id: row.gratuity.id, patch });
      return;
    }
    await insertG.mutateAsync({
      weddingId: w.id,
      bookingId: row.booking.id,
      budgetLineId: row.line?.id ?? null,
      cash: true,
      handedBy: defaultWho,
      ...patch,
    });
  }

  async function setAmount(row: (typeof rows)[number], field: "estimate" | "actual", value: number | null) {
    const estimate = field === "estimate" ? value : (row.line?.estimate ?? null);
    const actual = field === "actual" ? value : (row.line?.actual ?? null);

    if (estimate == null && actual == null) {
      if (row.line) await removeLine.mutateAsync(row.line.id);
      if (row.gratuity?.budgetLineId) await updateG.mutateAsync({ id: row.gratuity.id, patch: { budgetLineId: null } });
      return;
    }

    const description = `Tip · ${row.vendor.name}`;
    let lineId = row.line?.id;
    if (!row.line) {
      const created = await insertLine.mutateAsync({
        weddingId: w.id,
        category: "Gratuities",
        description,
        estimate,
        actual,
        bookingId: null,
        paidBy: "couple",
        serviceChargePct: null,
        taxPct: null,
      });
      lineId = created.id;
    } else {
      await updateLine.mutateAsync({
        id: row.line.id,
        patch: { estimate, actual, description, category: "Gratuities" },
      });
    }

    if (!row.gratuity) {
      await insertG.mutateAsync({
        weddingId: w.id,
        bookingId: row.booking.id,
        budgetLineId: lineId ?? null,
        cash: row.vendor.category !== "catering",
        handedBy: defaultWho,
      });
    } else if (row.gratuity.budgetLineId !== lineId) {
      await updateG.mutateAsync({ id: row.gratuity.id, patch: { budgetLineId: lineId ?? null } });
    }
  }

  if (rows.length === 0) return null;

  const suggestedTotal = sumKnown(rows.map((r) => r.suggested));
  const envelopeTotal = sumKnown(rows.map((r) => r.line?.estimate ?? null));
  const handedTotal = sumKnown(rows.map((r) => r.line?.actual ?? null));

  return (
    <TableShell
      header={
        <h2 className="text-sm font-semibold">Tip envelopes</h2>
      }
    >
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-background">Vendor</TableHead>
            <TableHead numeric>Envelope</TableHead>
            <TableHead numeric>Handed</TableHead>
            <TableHead>Cash</TableHead>
            <TableHead>Who</TableHead>
            <TableHead numeric>Suggested</TableHead>
            <TableHead>Category</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const estimate = r.line?.estimate ?? null;
            const actual = r.line?.actual ?? null;
            const cash = r.gratuity?.cash ?? false;
            const who = r.gratuity?.handedBy ?? defaultWho;
            const canUse = r.suggested != null && estimate !== r.suggested;
            return (
              <TableRow key={r.booking.id} className="group">
                <TableCell className="sticky left-0 z-10 bg-background font-medium group-hover:bg-muted/50">
                  {r.vendor.name}
                </TableCell>
                <TableCell numeric className="py-1">
                  <CellAmount
                    ariaLabel={`Envelope for ${r.vendor.name}`}
                    value={estimate}
                    onCommit={(n) => void setAmount(r, "estimate", n)}
                  />
                </TableCell>
                <TableCell numeric className="py-1">
                  <CellAmount
                    ariaLabel={`Handed amount for ${r.vendor.name}`}
                    value={actual}
                    onCommit={(n) => void setAmount(r, "actual", n)}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={cash}
                    aria-label={`Cash envelope for ${r.vendor.name}`}
                    onCheckedChange={(v) => void ensureMeta(r, { cash: v === true })}
                  />
                </TableCell>
                <TableCell className="py-1">
                  <GhostSelect
                    ariaLabel={`Who hands the envelope for ${r.vendor.name}`}
                    value={who}
                    options={whoOptions}
                    onChange={(handedBy) => void ensureMeta(r, { handedBy })}
                    className="w-28"
                  />
                </TableCell>
                <TableCell numeric className="text-muted-foreground">{money(r.suggested)}</TableCell>
                <TableCell className="text-muted-foreground">{VENDOR_CATEGORY_LABEL[r.vendor.category]}</TableCell>
                <TableCell className="py-1 text-right">
                  {canUse ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cellActionClass}
                      disabled={pending}
                      onClick={() => void setAmount(r, "estimate", r.suggested)}
                    >
                      Use suggested
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="sticky left-0 z-10 bg-muted/50">Total</TableCell>
            <TableCell numeric>{money(envelopeTotal)}</TableCell>
            <TableCell numeric>{money(handedTotal)}</TableCell>
            <TableCell colSpan={2} />
            <TableCell numeric>{money(suggestedTotal)}</TableCell>
            <TableCell colSpan={2} />
          </TableRow>
        </TableFooter>
      </Table>
    </TableShell>
  );
}
