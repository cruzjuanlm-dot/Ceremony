import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";

import { Button } from "@libretto-ui/button";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@libretto-ui/sheet";
import { Textarea } from "@libretto-ui/textarea";

import { DocStatusChip } from "~/components/status";
import { useRows, useUpdate, useWorkspace } from "~/data/hooks";
import type { DocumentRecord, DocumentStatus } from "~/data/types";
import { dateLong, money } from "~/lib/format";
import { DOC_KIND_LABEL, DOC_STATUS_LABEL } from "~/lib/wedding";

import { DOC_STATUSES, partyName, safeUrl } from "./doc-meta";

export function DocumentSheet({ doc, onClose }: { doc: DocumentRecord | null; onClose: () => void }) {
  return (
    <Sheet open={!!doc} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">{doc && <DocumentDetail key={doc.id} doc={doc} />}</SheetContent>
    </Sheet>
  );
}

function DocumentDetail({ doc }: { doc: DocumentRecord }) {
  const ws = useWorkspace();
  const weddings = useRows("weddings");
  const vendors = useRows("vendors");
  const clients = useRows("clients");
  const update = useUpdate("documents");
  const wedding = weddings.find((w) => w.id === doc.weddingId);
  const party = partyName(doc, vendors, clients);
  const printRef = useRef<HTMLDivElement>(null);
  const print = useReactToPrint({ contentRef: printRef, documentTitle: doc.title });

  const [notes, setNotes] = useState(doc.notes);
  const [url, setUrl] = useState(doc.url);
  const [amount, setAmount] = useState(doc.amount == null ? "" : String(doc.amount));

  const today = () => new Date().toISOString().slice(0, 10);
  const save = (patch: Partial<DocumentRecord>) => update.mutate({ id: doc.id, patch: { ...patch, updatedAt: today() } });
  const commitAmount = () => {
    const raw = amount.trim().replace(/[$,]/g, "");
    const next = raw === "" ? null : Number(raw);
    if (next != null && !Number.isFinite(next)) {
      setAmount(doc.amount == null ? "" : String(doc.amount));
      return;
    }
    if (next !== doc.amount) save({ amount: next });
  };
  const link = safeUrl(doc.url);

  return (
    <>
      <SheetHeader className="text-left">
        <SheetTitle className="pr-6">{doc.title}</SheetTitle>
        <SheetDescription>
          {DOC_KIND_LABEL[doc.kind]}
          {party ? ` · ${party}` : ""}
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <Label>Status</Label>
          <Select value={doc.status} onValueChange={(v) => save({ status: v as DocumentStatus })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {DOC_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ds-amount">Amount</Label>
          <Input
            id="ds-amount"
            inputMode="decimal"
            placeholder="—"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={commitAmount}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ds-url">Link</Label>
          <div className="flex gap-2">
            <Input
              id="ds-url"
              type="url"
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => url.trim() !== doc.url && save({ url: url.trim() })}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
            {link && (
              <Button variant="outline" size="icon" asChild>
                <a href={link} target="_blank" rel="noopener noreferrer" aria-label="Open link">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ds-notes">Notes</Label>
          <Textarea
            id="ds-notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== doc.notes && save({ notes })}
          />
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          {ws.plan === "pro" && (
            <>
              <dt className="text-muted-foreground">Wedding</dt>
              <dd>
                {wedding ? (
                  <Link to="/weddings/$weddingId" params={{ weddingId: wedding.id }} className="text-primary underline-offset-4 hover:underline">
                    {wedding.title}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </>
          )}
          <dt className="text-muted-foreground">Updated</dt>
          <dd>{dateLong(doc.updatedAt)}</dd>
        </dl>

        <div>
          <Button variant="outline" onClick={() => print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Print-only record — paper gets the facts, not the form. */}
      <div className="hidden">
        <div ref={printRef} className="p-8 text-sm text-black">
          <h1 className="text-xl font-semibold">{doc.title}</h1>
          <p className="mt-1 text-neutral-600">{ws.name}</p>
          <dl className="mt-6 grid grid-cols-[10rem_1fr] gap-y-2">
            <dt className="text-neutral-600">Kind</dt>
            <dd>{DOC_KIND_LABEL[doc.kind]}</dd>
            <dt className="text-neutral-600">Status</dt>
            <dd>
              <DocStatusChip status={doc.status} />
            </dd>
            {wedding && (
              <>
                <dt className="text-neutral-600">Wedding</dt>
                <dd>{wedding.title}</dd>
              </>
            )}
            {party && (
              <>
                <dt className="text-neutral-600">With</dt>
                <dd>{party}</dd>
              </>
            )}
            <dt className="text-neutral-600">Amount</dt>
            <dd>{money(doc.amount)}</dd>
            <dt className="text-neutral-600">Updated</dt>
            <dd>{dateLong(doc.updatedAt)}</dd>
            {doc.url && (
              <>
                <dt className="text-neutral-600">Link</dt>
                <dd className="break-all">{doc.url}</dd>
              </>
            )}
          </dl>
          {doc.notes && <p className="mt-6 whitespace-pre-line">{doc.notes}</p>}
        </div>
      </div>
    </>
  );
}
