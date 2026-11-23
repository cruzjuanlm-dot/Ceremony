import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";

import { SegmentedControl } from "@libretto-ui/segmented-control";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libretto-ui/table";

import { ClientSheet } from "~/components/clients/client-sheet";
import { clientFee, clientName, clientPipeline, feeTotal } from "~/components/clients/client-stats";
import { ClientStatusSelect } from "~/components/clients/client-status-select";
import { NewClientButton } from "~/components/clients/new-client-dialog";
import { Hero, HeroFigure } from "~/components/financials/hero";
import { Chip, CoupleName, EmptyState, toneText } from "~/components/kit";
import { useRows, useWorkspace } from "~/data/hooks";
import type { Client, ClientStatus, Wedding } from "~/data/types";
import { dateShort, money } from "~/lib/format";
import { CLIENT_STATUS_LABEL, SERVICE_LEVEL_LABEL } from "~/lib/wedding";
import { cn, PageHeader } from "~/shared/libretto";

export const Route = createFileRoute("/_app/clients")({
  component: ClientsPage,
});

type View = "board" | "list";
const COLUMNS: ClientStatus[] = ["inquiry", "proposal", "booked", "completed", "lost"];

function ClientsPage() {
  const ws = useWorkspace();
  const clients = useRows("clients");
  const weddings = useRows("weddings");
  const [view, setView] = useState<View>("board");
  const [openId, setOpenId] = useState<string | null>(null);

  // A couple has no clients (ceremony/CLAUDE.md).
  if (ws.plan === "diy") return <Navigate to="/dashboard" replace />;

  const p = clientPipeline(clients, weddings);
  const weddingOf = (c: Client) => weddings.find((w) => w.clientId === c.id) ?? null;
  const sorted = [...clients].sort((a, b) => {
    const da = weddingOf(a)?.date ?? "9999";
    const db = weddingOf(b)?.date ?? "9999";
    return da.localeCompare(db);
  });
  const open = clients.filter((c) => c.status === "inquiry" || c.status === "proposal").length;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Clients"
        description={`${clients.length} couples · ${open} in the pipeline`}
        actions={<NewClientButton onCreated={setOpenId} />}
      />

      <Hero>
        <div className="flex flex-wrap items-end gap-x-12 gap-y-4">
          <HeroFigure
            label="Booked revenue"
            value={money(p.bookedRevenue)}
            valueClassName={toneText("good")}
            sub={`${p.bookedCount} booked or completed`}
          />
          <HeroFigure
            label="In the pipeline"
            value={money(p.pipelineValue)}
            valueClassName="text-2xl sm:text-3xl text-muted-foreground"
            sub={`${p.pipelineCount} inquiries and proposals`}
          />
        </div>
      </Hero>

      <div className="mb-4">
        <SegmentedControl
          aria-label="Clients view"
          value={view}
          onValueChange={setView}
          options={[
            { value: "board", label: "Board" },
            { value: "list", label: "List" },
          ]}
        />
      </div>

      {clients.length === 0 ? (
        <EmptyState title="No clients yet" action={<NewClientButton onCreated={setOpenId} />}>
          Add your first inquiry to start tracking proposals and fees.
        </EmptyState>
      ) : view === "board" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {COLUMNS.map((status) => {
            const items = sorted.filter((c) => c.status === status);
            const columnFee = feeTotal(items, weddings);
            return (
              <section key={status} className={cn("min-w-0", status === "lost" && "opacity-75")}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="text-sm font-semibold">{CLIENT_STATUS_LABEL[status]}</h2>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {items.length}
                    {items.length > 0 && columnFee != null && ` · ${money(columnFee)}`}
                  </span>
                </div>
                <div className="grid gap-2">
                  {items.length === 0 && <div className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">None</div>}
                  {items.map((c) => (
                    <ClientCard key={c.id} client={c} wedding={weddingOf(c)} fee={clientFee(c, weddings)} onOpen={() => setOpenId(c.id)} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Couple</TableHead>
              <TableHead>Wedding</TableHead>
              <TableHead>Service</TableHead>
              <TableHead numeric>Fee</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((c) => {
              const w = weddingOf(c);
              return (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setOpenId(c.id)}>
                  <TableCell>
                    <CoupleName className="text-base">{clientName(c)}</CoupleName>
                  </TableCell>
                  <TableCell>
                    <div>{dateShort(w?.date)}</div>
                    {w?.city && <div className="text-xs text-muted-foreground">{w.city}</div>}
                  </TableCell>
                  <TableCell>{SERVICE_LEVEL_LABEL[c.serviceLevel]}</TableCell>
                  <TableCell numeric>{money(clientFee(c, weddings))}</TableCell>
                  <TableCell className="text-muted-foreground">{c.source || "—"}</TableCell>
                  <TableCell>
                    <Chip>{c.language.toUpperCase()}</Chip>
                  </TableCell>
                  <TableCell className="py-0">
                    <ClientStatusSelect client={c} className="-ml-1.5 text-sm" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <ClientSheet clientId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function ClientCard({
  client: c,
  wedding: w,
  fee,
  onOpen,
}: {
  client: Client;
  wedding: Wedding | null;
  fee: number | null;
  onOpen: () => void;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      className="min-w-0 cursor-pointer rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <CoupleName className="min-w-0 text-base leading-tight">{clientName(c)}</CoupleName>
        <Chip className="shrink-0">{c.language.toUpperCase()}</Chip>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {w?.date ? dateShort(w.date) : "Date TBD"}
        {w?.city && ` · ${w.city}`}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2 text-sm">
        <span className="min-w-0 truncate">{SERVICE_LEVEL_LABEL[c.serviceLevel]}</span>
        <span className="font-medium tabular-nums">{money(fee)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-muted-foreground" title={c.source}>{c.source || "—"}</span>
        <ClientStatusSelect client={c} className="-mr-1.5" />
      </div>
    </article>
  );
}
