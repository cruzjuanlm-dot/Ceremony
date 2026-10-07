import { Fragment, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Search } from "lucide-react";

import { Input } from "@libretto-ui/input";
import { SegmentedControl } from "@libretto-ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableSectionRow } from "@libretto-ui/table";

import { AddDocumentButton } from "~/components/documents/add-document-dialog";
import { DOC_KINDS, isDone, needsAction, partyName, safeUrl } from "~/components/documents/doc-meta";
import { DocumentSheet } from "~/components/documents/document-sheet";
import { CoupleName, EmptyState, toneText } from "~/components/kit";
import { DocStatusChip } from "~/components/status";
import { useRows, useWorkspace } from "~/data/hooks";
import type { DocumentKind, DocumentRecord } from "~/data/types";
import { dateShort, money } from "~/lib/format";
import { DOC_KIND_LABEL } from "~/lib/wedding";
import { PageHeader } from "~/shared/libretto";

export const Route = createFileRoute("/_app/documents")({
  component: DocumentsPage,
});

type StatusLens = "all" | "action" | "done";
type Layout = "list" | "wedding";

function DocumentsPage() {
  const ws = useWorkspace();
  const docs = useRows("documents");
  const weddings = useRows("weddings");
  const vendors = useRows("vendors");
  const clients = useRows("clients");
  const pro = ws.plan === "pro";

  const [kind, setKind] = useState<DocumentKind | "all">("all");
  const [lens, setLens] = useState<StatusLens>("all");
  const [weddingId, setWeddingId] = useState("all");
  const [q, setQ] = useState("");
  const [layout, setLayout] = useState<Layout>("list");
  const [openId, setOpenId] = useState<string | null>(null);

  const awaiting = docs.filter((d) => d.status === "sent").length;
  const drafts = docs.filter((d) => d.status === "draft").length;
  const expired = docs.filter((d) => d.status === "expired").length;
  const done = docs.filter(isDone).length;

  const weddingTitle = (id: string | null) => weddings.find((w) => w.id === id)?.title ?? "";
  const query = q.trim().toLowerCase();
  const rows = docs
    .filter((d) => {
      if (kind !== "all" && d.kind !== kind) return false;
      if (lens === "action" && !needsAction(d)) return false;
      if (lens === "done" && !isDone(d)) return false;
      if (weddingId !== "all" && d.weddingId !== weddingId) return false;
      if (query) {
        const hay = [d.title, d.notes, partyName(d, vendors, clients) ?? "", weddingTitle(d.weddingId)].join(" ").toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const grouped = pro && layout === "wedding";
  const groups: { key: string; title: string; docs: DocumentRecord[] }[] = [];
  if (grouped) {
    for (const d of rows) {
      const key = d.weddingId ?? "none";
      let g = groups.find((x) => x.key === key);
      if (!g) groups.push((g = { key, title: weddingTitle(d.weddingId) || "No wedding", docs: [] }));
      g.docs.push(d);
    }
    // Weddings in date order; unattached documents last.
    const dateOf = (k: string) => weddings.find((w) => w.id === k)?.date ?? "9999";
    groups.sort((a, b) => (a.key === "none" ? 1 : b.key === "none" ? -1 : dateOf(a.key).localeCompare(dateOf(b.key))));
  }

  const open = docs.find((d) => d.id === openId) ?? null;
  const colCount = pro && !grouped ? 8 : 7;

  const row = (d: DocumentRecord) => {
    const link = safeUrl(d.url);
    return (
      <TableRow key={d.id} className="cursor-pointer" onClick={() => setOpenId(d.id)}>
        <TableCell className="max-w-72 truncate font-medium">{d.title}</TableCell>
        <TableCell className="text-muted-foreground">{DOC_KIND_LABEL[d.kind]}</TableCell>
        {pro && !grouped && <TableCell className="max-w-48 truncate">{weddingTitle(d.weddingId) || "—"}</TableCell>}
        <TableCell className="max-w-48 truncate">{partyName(d, vendors, clients) ?? "—"}</TableCell>
        <TableCell>
          <DocStatusChip status={d.status} />
        </TableCell>
        <TableCell numeric>{money(d.amount)}</TableCell>
        <TableCell className="text-muted-foreground">{dateShort(d.updatedAt)}</TableCell>
        <TableCell className="w-10">
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${d.title}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <span className="block h-8 w-8" />
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Contracts & docs" actions={<AddDocumentButton />} />

      {docs.length > 0 && (
        <section className="mb-6 rounded-xl bg-card px-5 py-4 elevate">
          <div className="text-xs text-muted-foreground">Needs action</div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-semibold tabular-nums">{awaiting + drafts}</span>
            <span className="text-sm">
              <span className={awaiting ? toneText("info") : "text-muted-foreground"}>
                {awaiting} awaiting signature
              </span>
              <span className="text-muted-foreground"> · {drafts} {drafts === 1 ? "draft" : "drafts"}</span>
              {expired > 0 && <span className={toneText("bad")}> · {expired} expired</span>}
            </span>
          </div>
          <div className="mt-1.5 text-xs text-muted-foreground">{done} signed, paid or filed</div>
        </section>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SegmentedControl
          aria-label="Document status"
          value={lens}
          onValueChange={setLens}
          options={[
            { value: "all", label: "All" },
            { value: "action", label: "Needs action" },
            { value: "done", label: "Signed & filed" },
          ]}
        />
        <Select value={kind} onValueChange={(v) => setKind(v as DocumentKind | "all")}>
          <SelectTrigger className="h-8 w-40" aria-label="Kind">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All kinds</SelectItem>
            {DOC_KINDS.map((k) => (
              <SelectItem key={k} value={k}>
                {DOC_KIND_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pro && (
          <Select value={weddingId} onValueChange={setWeddingId}>
            <SelectTrigger className="h-8 w-48" aria-label="Wedding">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All weddings</SelectItem>
              {weddings.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search documents" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 w-48 pl-8" />
        </div>
        {pro && (
          <SegmentedControl
            aria-label="Layout"
            className="ml-auto"
            value={layout}
            onValueChange={setLayout}
            options={[
              { value: "list", label: "List" },
              { value: "wedding", label: "By wedding" },
            ]}
          />
        )}
      </div>

      {docs.length === 0 ? (
        <EmptyState title="No documents yet" action={<AddDocumentButton />}>
          Add a link to each contract, proposal and permit so nothing waits on a signature unnoticed.
        </EmptyState>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No documents match</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Kind</TableHead>
                {pro && !grouped && <TableHead>Wedding</TableHead>}
                <TableHead>{pro ? "Vendor / client" : "Vendor"}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead numeric>Amount</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Link</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped
                ? groups.map((g) => (
                    <Fragment key={g.key}>
                      <TableSectionRow>
                        <TableCell colSpan={colCount}>
                          <CoupleName className="text-base">{g.title}</CoupleName>
                          <span className="ml-2 text-xs text-muted-foreground">{g.docs.length}</span>
                        </TableCell>
                      </TableSectionRow>
                      {g.docs.map(row)}
                    </Fragment>
                  ))
                : rows.map(row)}
            </TableBody>
          </Table>
        </div>
      )}

      <DocumentSheet doc={open} onClose={() => setOpenId(null)} />
    </div>
  );
}
