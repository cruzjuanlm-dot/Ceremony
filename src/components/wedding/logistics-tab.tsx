import { ExternalLink, MapPin, Trash2 } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libretto-ui/table";
import { Textarea } from "@libretto-ui/textarea";

import { Chip, EmptyState, Meter, Panel } from "~/components/kit";
import { StageChip } from "~/components/status";
import { useRemove, useRows, useUpdate, useWeddingRows } from "~/data/hooks";
import type { RoomBlock, Vendor, Wedding } from "~/data/types";
import { daysBetween, todayIso } from "~/lib/finance";
import { dateShort, money, time12 } from "~/lib/format";
import { cellActionClass, cn } from "~/shared/libretto";

import { CellInt } from "./guests/cells";
import { AddRoomBlockButton } from "./logistics/add-room-block-dialog";
import { inHurricaneSeason, jurisdictionOf, licenseChecklist } from "./logistics/license";
import { mapsHref, safeHref } from "./logistics/links";

const IO_LABEL = { indoor: "Indoor", outdoor: "Outdoor", both: "Indoor & outdoor" } as const;

export function LogisticsTab({ wedding }: { wedding: Wedding }) {
  const vendors = useRows("vendors");
  const jurisdiction = jurisdictionOf(wedding.city);

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid min-w-0 grid-cols-1 content-start gap-6">
        <Venues wedding={wedding} vendors={vendors} />
        <RoomBlocks wedding={wedding} />
        <Transportation wedding={wedding} vendors={vendors} />
      </div>
      <div className="grid min-w-0 grid-cols-1 content-start gap-6">
        <RainPlan wedding={wedding} jurisdiction={jurisdiction} />
        {jurisdiction && <LicenseCard wedding={wedding} jurisdiction={jurisdiction} />}
      </div>
    </div>
  );
}

/* ---------- venues (hero) ----------------------------------------------------------- */

function Venues({ wedding, vendors }: { wedding: Wedding; vendors: Vendor[] }) {
  const { mutate: update } = useUpdate("weddings");
  const venueVendors = vendors.filter((v) => v.category === "venue");
  const ceremony = vendors.find((v) => v.id === wedding.ceremonyVenueId) ?? null;
  const reception = vendors.find((v) => v.id === wedding.venueId) ?? null;

  const cards: { vendor: Vendor; roles: string[] }[] = [];
  if (ceremony && reception && ceremony.id === reception.id) cards.push({ vendor: reception, roles: ["Ceremony", "Reception"] });
  else {
    if (ceremony) cards.push({ vendor: ceremony, roles: ["Ceremony"] });
    if (reception) cards.push({ vendor: reception, roles: ["Reception"] });
  }

  const picker = (label: string, current: Vendor | null, field: "ceremonyVenueId" | "venueId") => {
    const options = current && current.category !== "venue" ? [current, ...venueVendors] : venueVendors;
    return (
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <Select value={current?.id ?? "none"} onValueChange={(v) => update({ id: wedding.id, patch: { [field]: v === "none" ? null : v } })}>
          <SelectTrigger aria-label={`${label} venue`} className="h-8 w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not chosen</SelectItem>
            {options.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    );
  };

  return (
    <section className="grid min-w-0 grid-cols-1 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Venue</h3>
        <div className="no-print flex flex-wrap gap-3">
          {picker("Ceremony", ceremony, "ceremonyVenueId")}
          {picker("Reception", reception, "venueId")}
        </div>
      </div>
      {cards.length === 0 ? (
        <EmptyState title="No venue yet">Pick one above, or add venues on the Vendors page.</EmptyState>
      ) : (
        <div className={cn("grid gap-4", cards.length > 1 && "md:grid-cols-2")}>
          {cards.map((c) => (
            <VenueCard key={c.vendor.id} vendor={c.vendor} roles={c.roles} wedding={wedding} />
          ))}
        </div>
      )}
    </section>
  );
}

function VenueCard({ vendor: v, roles, wedding }: { vendor: Vendor; roles: string[]; wedding: Wedding }) {
  const over = v.capacity != null && v.capacity < wedding.guestEstimate;
  const mapQuery = v.address || `${v.name} ${v.city}`;
  return (
    <article className="rounded-xl bg-card px-5 py-4 elevate">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            {roles.map((r) => (
              <Chip key={r} tone="brand">
                {r}
              </Chip>
            ))}
          </div>
          <h4 className="mt-2 text-lg font-semibold">{v.name}</h4>
          <p className="text-sm text-muted-foreground">{v.address || v.city}</p>
        </div>
        <Button asChild size="sm" variant="outline" className="no-print">
          <a href={mapsHref(mapQuery)} target="_blank" rel="noopener noreferrer">
            <MapPin />
            Open in Maps
          </a>
        </Button>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Capacity</dt>
          <dd className="flex items-center gap-1.5 tabular-nums">
            {v.capacity ?? "—"}
            {over && <Chip tone="bad">Under {wedding.guestEstimate} guests</Chip>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Setting</dt>
          <dd>{v.indoorOutdoor ? IO_LABEL[v.indoorOutdoor] : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Contact</dt>
          <dd>{v.contactName || "—"}</dd>
          {v.phone && (
            <dd>
              <a href={`tel:${v.phone.replace(/[^\d+]/g, "")}`} className="tabular-nums text-muted-foreground hover:underline">
                {v.phone}
              </a>
            </dd>
          )}
          {v.email && (
            <dd className="truncate">
              <a href={`mailto:${v.email}`} className="text-muted-foreground hover:underline">
                {v.email}
              </a>
            </dd>
          )}
        </div>
      </dl>
      {v.notes && <p className="mt-3 border-t pt-3 text-sm">{v.notes}</p>}
    </article>
  );
}

/* ---------- rain plan --------------------------------------------------------------- */

function RainPlan({ wedding, jurisdiction }: { wedding: Wedding; jurisdiction: "PR" | "FL" | null }) {
  const { mutate: update } = useUpdate("weddings");
  const hurricane = jurisdiction != null && inHurricaneSeason(wedding.date);
  return (
    <Panel title="Rain plan" actions={hurricane ? <Chip tone="warn">Hurricane season</Chip> : undefined}>
      <Textarea
        key={wedding.rainPlan}
        aria-label="Rain plan"
        defaultValue={wedding.rainPlan}
        placeholder="Where does everything move if it rains, and who makes the call by when?"
        rows={4}
        onBlur={(e) => {
          const v = e.currentTarget.value.trim();
          if (v !== wedding.rainPlan) update({ id: wedding.id, patch: { rainPlan: v } });
        }}
        className="resize-y border-transparent bg-transparent px-0 shadow-none hover:border-input hover:bg-background hover:px-3 focus-visible:border-input focus-visible:bg-background focus-visible:px-3"
      />
    </Panel>
  );
}

/* ---------- room blocks ------------------------------------------------------------- */

function RoomBlocks({ wedding }: { wedding: Wedding }) {
  const blocks = useWeddingRows("roomBlocks", wedding.id);
  const { mutate: update } = useUpdate("roomBlocks");
  const { mutate: remove } = useRemove("roomBlocks");
  const today = todayIso();

  return (
    <section className="grid min-w-0 grid-cols-1 gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Room blocks</h3>
        <div className="no-print">
          <AddRoomBlockButton wedding={wedding} />
        </div>
      </div>
      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No room blocks.</p>
      ) : (
        <Table className="min-w-[680px]">
          <TableHeader>
            <TableRow>
              <TableHead>Hotel</TableHead>
              <TableHead numeric>Rate</TableHead>
              <TableHead numeric className="w-20">
                Booked
              </TableHead>
              <TableHead numeric className="w-14">
                Held
              </TableHead>
              <TableHead className="w-32">Pickup</TableHead>
              <TableHead>Cutoff</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blocks.map((b) => (
              <RoomBlockRow
                key={b.id}
                block={b}
                today={today}
                onBooked={(roomsBooked) => update({ id: b.id, patch: { roomsBooked } })}
                onRemove={() => remove(b.id)}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

function RoomBlockRow({
  block: b,
  today,
  onBooked,
  onRemove,
}: {
  block: RoomBlock;
  today: string;
  onBooked: (n: number) => void;
  onRemove: () => void;
}) {
  const href = safeHref(b.bookingLink);
  const daysLeft = daysBetween(today, b.cutoffDate);
  const full = b.roomsHeld > 0 && b.roomsBooked >= b.roomsHeld;
  const cutoffChip =
    daysLeft < 0 ? (
      <Chip tone="muted">Passed</Chip>
    ) : daysLeft <= 30 && !full ? (
      <Chip tone="warn">{daysLeft === 0 ? "Today" : `${daysLeft} days left`}</Chip>
    ) : null;

  return (
    <TableRow>
      <TableCell className="font-medium">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
            {b.hotel}
            <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          </a>
        ) : (
          b.hotel
        )}
      </TableCell>
      <TableCell numeric>{b.rate ? `${money(b.rate)}/night` : "—"}</TableCell>
      <TableCell numeric className="py-1">
        <CellInt ariaLabel={`Rooms booked at ${b.hotel}`} value={b.roomsBooked} onCommit={(n) => onBooked(n ?? 0)} />
      </TableCell>
      <TableCell numeric className="text-muted-foreground">
        {b.roomsHeld}
      </TableCell>
      <TableCell>
        <Meter value={b.roomsBooked} max={b.roomsHeld} tone={full ? "good" : "brand"} label={`Rooms booked of held at ${b.hotel}`} />
      </TableCell>
      <TableCell>
        <span className="mr-2 tabular-nums">{dateShort(b.cutoffDate)}</span>
        {cutoffChip}
      </TableCell>
      <TableCell className="py-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${b.hotel} room block`}
          className={cn("no-print h-8 w-8 text-muted-foreground hover:text-red-600", cellActionClass)}
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </TableCell>
    </TableRow>
  );
}

/* ---------- transportation ---------------------------------------------------------- */

function Transportation({ wedding, vendors }: { wedding: Wedding; vendors: Vendor[] }) {
  const rows = useWeddingRows("bookings", wedding.id)
    .map((b) => ({ b, v: vendors.find((v) => v.id === b.vendorId) }))
    .filter((r) => r.v?.category === "transportation" && r.b.stage !== "declined");
  if (rows.length === 0) return null;

  return (
    <section className="grid min-w-0 grid-cols-1 gap-3">
      <h3 className="text-sm font-semibold">Transportation</h3>
      <Table className="min-w-[560px]">
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Arrives</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead numeric>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ b, v }) => (
            <TableRow key={b.id}>
              <TableCell className="font-medium">{v!.name}</TableCell>
              <TableCell>
                <StageChip stage={b.stage} />
              </TableCell>
              <TableCell className="tabular-nums">{time12(b.arrivalTime)}</TableCell>
              <TableCell>
                {v!.contactName || "—"}
                {v!.phone && <span className="ml-2 tabular-nums text-muted-foreground">{v!.phone}</span>}
              </TableCell>
              <TableCell numeric>{money(b.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

/* ---------- marriage license -------------------------------------------------------- */

function LicenseCard({ wedding, jurisdiction }: { wedding: Wedding; jurisdiction: "PR" | "FL" }) {
  const groups = licenseChecklist(wedding, jurisdiction);
  return (
    <Panel title="Requirements to confirm with the registry">
      <div className="grid gap-4">
        {groups.map((g) => (
          <div key={g.group}>
            <h4 className="text-xs font-medium text-muted-foreground">{g.group}</h4>
            <ul className="mt-1.5 grid gap-1.5">
              {g.items.map((it) => (
                <li key={it.text} className="flex gap-2 text-sm">
                  <span aria-hidden="true" className="mt-1 h-3.5 w-3.5 shrink-0 rounded-[3px] border border-muted-foreground/50" />
                  <span className="min-w-0">
                    {it.text}
                    {it.verify && (
                      <Chip tone="muted" className="ml-1.5 align-middle">
                        Verify
                      </Chip>
                    )}
                    {it.when && <span className="block text-xs text-amber-700 dark:text-amber-400">{it.when}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}
