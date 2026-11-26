import { Link } from "@tanstack/react-router";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@libretto-ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libretto-ui/table";

import { AddPaymentButton } from "~/components/financials/add-payment-dialog";
import { MarkPaidButton } from "~/components/financials/mark-paid-button";
import { CoupleName, toneText } from "~/components/kit";
import { PhoneScrollHint } from "~/components/phone-scroll-hint";
import { ClientStatusChip, PaymentChip, PhaseChip } from "~/components/status";
import { InlineNotes, InlineSelect, InlineText } from "~/components/vendors/inline-field";
import { useRows, useUpdate } from "~/data/hooks";
import type { Client, ClientStatus, ServiceLevel } from "~/data/types";
import { paymentState, paymentTotals, plannerFee, sumKnown, todayIso } from "~/lib/finance";
import { dateLong, dateShort, money } from "~/lib/format";
import { CLIENT_STATUS_LABEL, SERVICE_LEVEL_LABEL, weddingPhase } from "~/lib/wedding";
import { cn } from "~/shared/libretto";

import { clientName } from "./client-stats";
import { FeeTermsEditor } from "./fee-terms";
import { useSaveFee } from "./follow-fee";

export const STATUS_OPTIONS = (Object.keys(CLIENT_STATUS_LABEL) as ClientStatus[]).map((k) => ({
  value: k,
  label: CLIENT_STATUS_LABEL[k],
}));
export const SERVICE_OPTIONS = (Object.keys(SERVICE_LEVEL_LABEL) as ServiceLevel[]).map((k) => ({
  value: k,
  label: SERVICE_LEVEL_LABEL[k],
}));
const LANGUAGE_OPTIONS = [
  { value: "en" as const, label: "English" },
  { value: "es" as const, label: "Español" },
];

export function ClientSheet({ clientId, onClose }: { clientId: string | null; onClose: () => void }) {
  const client = useRows("clients").find((c) => c.id === clientId) ?? null;
  return (
    <Sheet open={!!client} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">{client && <ClientDetail client={client} />}</SheetContent>
    </Sheet>
  );
}

function ClientDetail({ client }: { client: Client }) {
  const update = useUpdate("clients");
  const saveFee = useSaveFee();
  const weddings = useRows("weddings").filter((w) => w.clientId === client.id);
  const weddingIds = new Set(weddings.map((w) => w.id));
  const fees = useRows("payments")
    .filter((p) => p.direction === "incoming" && weddingIds.has(p.weddingId))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const today = todayIso();
  const totals = paymentTotals(fees, today);
  const scheduled = sumKnown(fees.map((p) => p.amount));
  const quote = weddings.length > 1 ? null : plannerFee(client, weddings[0]?.budgetTarget ?? null);
  const mismatch = quote != null && scheduled != null && scheduled !== quote;
  const save = (patch: Partial<Client>) => update.mutate({ id: client.id, patch });
  const saveTerms = (patch: Partial<Client>) => void saveFee(client, patch);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <SheetHeader className="space-y-1.5 pr-8 text-left">
        <SheetTitle className="text-2xl font-normal">
          <CoupleName>{clientName(client)}</CoupleName>
        </SheetTitle>
        <div className="flex flex-wrap items-center gap-1.5">
          <ClientStatusChip status={client.status} />
          <span className="text-xs text-muted-foreground">Client since {dateShort(client.createdAt)}</span>
        </div>
      </SheetHeader>

      <div className="grid gap-1">
        <InlineText label="Partner" value={client.partner1} onCommit={(v) => v && save({ partner1: v })} />
        <InlineText label="Partner" value={client.partner2} onCommit={(v) => save({ partner2: v })} />
        <InlineText label="Email" type="email" value={client.email} onCommit={(v) => save({ email: v })} />
        <InlineText label="Phone" type="tel" value={client.phone} onCommit={(v) => save({ phone: v })} />
        <InlineSelect label="Status" value={client.status} options={STATUS_OPTIONS} onCommit={(v) => save({ status: v })} />
        <InlineSelect
          label="Service"
          value={client.serviceLevel}
          options={SERVICE_OPTIONS}
          onCommit={(v) => save({ serviceLevel: v })}
        />
        <FeeTermsEditor client={client} quote={weddings.length > 1 ? undefined : quote} onCommit={saveTerms} />
        {mismatch && <p className={cn("text-xs", toneText("warn"))}>Installments total {money(scheduled)}.</p>}
        <InlineText label="Source" value={client.source} onCommit={(v) => save({ source: v })} />
        <InlineSelect label="Language" value={client.language} options={LANGUAGE_OPTIONS} onCommit={(v) => save({ language: v })} />
        <div className="mt-2">
          <InlineNotes label="Notes" value={client.notes} onCommit={(v) => save({ notes: v })} />
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Wedding</h3>
        {weddings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No wedding yet.</p>
        ) : (
          <ul className="grid gap-2">
            {weddings.map((w) => (
              <li key={w.id}>
                <Link
                  to="/weddings/$weddingId"
                  params={{ weddingId: w.id }}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <CoupleName className="text-base">{w.title}</CoupleName>
                    <div className="text-xs text-muted-foreground">
                      {dateLong(w.date)}
                      {w.city && ` · ${w.city}`}
                    </div>
                    {weddings.length > 1 && (
                      <div className="text-xs tabular-nums">{money(plannerFee(client, w.budgetTarget))}</div>
                    )}
                  </div>
                  <PhaseChip phase={weddingPhase(w)} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {weddings.length > 0 && (
        <section>
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Fee payments</h3>
            {weddings.length === 1 && <AddPaymentButton defaultDirection="incoming" weddingId={weddings[0].id} variant="outline" />}
          </div>
          {fees.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">No fee installments scheduled.</p>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <span>
                  <span className="text-muted-foreground">Received </span>
                  <span className={cn("font-medium tabular-nums", toneText("good"))}>{money(totals.paid)}</span>
                </span>
                <span>
                  <span className="text-muted-foreground">Outstanding </span>
                  <span className="font-medium tabular-nums">{money(totals.outstanding)}</span>
                </span>
                {totals.overdue > 0 && (
                  <span>
                    <span className="text-muted-foreground">Overdue </span>
                    <span className={cn("font-medium tabular-nums", toneText("bad"))}>{money(totals.overdue)}</span>
                  </span>
                )}
              </div>
              <PhoneScrollHint>
              <Table className="min-w-[32rem]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Installment</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead numeric>Amount</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.label}</TableCell>
                      <TableCell>{dateShort(p.dueDate)}</TableCell>
                      <TableCell numeric>{money(p.amount)}</TableCell>
                      <TableCell>
                        <PaymentChip state={paymentState(p, today)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <MarkPaidButton payment={p} alwaysVisible />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </PhoneScrollHint>
            </>
          )}
        </section>
      )}
    </div>
  );
}
