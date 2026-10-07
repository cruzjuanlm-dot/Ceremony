import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, LayoutGrid, Move } from "lucide-react";

import { Button } from "@libretto-ui/button";

import { Chip } from "~/components/kit";
import { FloorPlanSketch } from "~/components/studio/floor-plan-sketch";
import { useRows } from "~/data/hooks";
import { todayIso } from "~/lib/finance";
import { PageHeader } from "~/shared/libretto";

export const Route = createFileRoute("/_app/studio")({
  component: StudioPage,
});

const COMING = [
  { icon: Move, title: "Drag-and-drop seating", sub: "Guests onto tables, straight from the guest list" },
  { icon: LayoutGrid, title: "Floor plan", sub: "Tables, dance floor, stage, bars" },
  { icon: Box, title: "3D venue preview", sub: "Walk the room before the day" },
];

function StudioPage() {
  const weddings = useRows("weddings");
  const today = todayIso();
  const next = weddings
    .filter((w) => w.date && w.date >= today)
    .sort((a, b) => a.date!.localeCompare(b.date!))[0] ?? weddings[0];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Design studio" />

      <section className="grid items-center gap-8 rounded-xl bg-card p-6 elevate md:grid-cols-[1fr_minmax(0,22rem)] md:p-8">
        <div>
          <Chip tone="brand">Coming soon</Chip>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">Seating charts and floor plans</h2>
          <ul className="mt-6 space-y-4">
            {COMING.map(({ icon: Icon, title, sub }) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="block text-sm text-muted-foreground">{sub}</span>
                </span>
              </li>
            ))}
          </ul>
          {next && (
            <Button asChild variant="outline" className="mt-6">
              <Link to="/weddings/$weddingId" params={{ weddingId: next.id }} search={{ tab: "guests" } as never}>
                Assign tables
              </Link>
            </Button>
          )}
        </div>
        <FloorPlanSketch className="mx-auto w-full max-w-sm opacity-90" />
      </section>
    </div>
  );
}
