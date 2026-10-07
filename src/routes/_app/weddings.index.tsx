import { useState } from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";

import { SegmentedControl } from "@libretto-ui/segmented-control";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libretto-ui/table";

import { CoupleName, EmptyState, Meter } from "~/components/kit";
import { PhaseChip } from "~/components/status";
import { NewWeddingButton } from "~/components/weddings/new-wedding-dialog";
import { useRows, useWorkspace } from "~/data/hooks";
import { budgetSummary, guestSummary, todayIso } from "~/lib/finance";
import { dateShort, money } from "~/lib/format";
import { countdownLabel, daysUntil, weddingPhase } from "~/lib/wedding";
import { PageHeader } from "~/shared/libretto";

export const Route = createFileRoute("/_app/weddings/")({
  component: WeddingsPage,
});

type Lens = "upcoming" | "past" | "all";

function WeddingsPage() {
  const ws = useWorkspace();
  const weddings = useRows("weddings");
  const lines = useRows("budgetLines");
  const guests = useRows("guests");
  const tasks = useRows("tasks");
  const venues = useRows("vendors");
  const navigate = useNavigate();
  const [lens, setLens] = useState<Lens>("upcoming");

  // A DIY workspace IS one wedding — the list would be a list of one.
  if (ws.plan === "diy" && weddings[0]) {
    return <Navigate to="/weddings/$weddingId" params={{ weddingId: weddings[0].id }} replace />;
  }

  const today = todayIso();
  const rows = weddings
    .filter((w) => {
      if (lens === "all") return true;
      const past = w.date != null && w.date < today;
      return lens === "past" ? past : !past;
    })
    .sort((a, b) => {
      // Undated inquiries sink to the bottom; past weddings show most-recent first.
      if (!a.date) return 1;
      if (!b.date) return -1;
      return lens === "past" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Weddings"
        description={`${weddings.filter((w) => w.date && w.date >= today).length} upcoming`}
        actions={<NewWeddingButton />}
      />
      <div className="mb-4">
        <SegmentedControl
          aria-label="Which weddings"
          value={lens}
          onValueChange={setLens}
          options={[
            { value: "upcoming", label: "Upcoming" },
            { value: "past", label: "Past" },
            { value: "all", label: "All" },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState title={lens === "past" ? "No past weddings yet" : "No upcoming weddings"} action={<NewWeddingButton />}>
          Add a wedding to start its budget, guest list and day-of timeline.
        </EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Couple</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead numeric>Guests</TableHead>
              <TableHead numeric>Projected</TableHead>
              <TableHead numeric>Target</TableHead>
              <TableHead className="w-36">Checklist</TableHead>
              <TableHead>Stage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((w) => {
              const b = budgetSummary(lines.filter((l) => l.weddingId === w.id), w.budgetTarget);
              const g = guestSummary(guests.filter((x) => x.weddingId === w.id));
              const t = tasks.filter((x) => x.weddingId === w.id);
              const done = t.filter((x) => x.done).length;
              const venue = venues.find((v) => v.id === w.venueId);
              return (
                <TableRow
                  key={w.id}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/weddings/$weddingId", params: { weddingId: w.id } })}
                >
                  <TableCell>
                    <CoupleName className="text-base">{w.title}</CoupleName>
                    <div className="text-xs text-muted-foreground">{w.city}</div>
                  </TableCell>
                  <TableCell>
                    <div>{dateShort(w.date)}</div>
                    <div className="text-xs text-muted-foreground">{countdownLabel(daysUntil(w))}</div>
                  </TableCell>
                  <TableCell className="max-w-48 truncate">{venue?.name ?? "—"}</TableCell>
                  <TableCell numeric>
                    {g.invited ? (
                      <>
                        {g.attending}
                        <span className="text-muted-foreground"> / {g.invited}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">~{w.guestEstimate}</span>
                    )}
                  </TableCell>
                  <TableCell numeric className={b.overBudget ? "text-red-600" : undefined}>
                    {b.projected ? money(b.projected) : "—"}
                  </TableCell>
                  <TableCell numeric className="text-muted-foreground">{money(w.budgetTarget)}</TableCell>
                  <TableCell>
                    {t.length ? (
                      <div className="flex items-center gap-2">
                        <Meter value={done} max={t.length} label="Checklist progress" />
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {done}/{t.length}
                        </span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <PhaseChip phase={weddingPhase(w)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
