import { memo } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@libretto-ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSectionRow,
} from "@libretto-ui/table";

import type { Guest, MealChoice, RsvpStatus } from "~/data/types";
import { cellActionClass, cn } from "~/shared/libretto";

import { CellInt, CellSelect, CellText } from "./cells";
import { MEAL_OPTIONS, RSVP_OPTIONS, fullName } from "./couple";

export type PatchGuest = (id: string, patch: Partial<Guest>) => void;

const MEAL_WITH_BLANK: { value: MealChoice | "none"; label: string }[] = [{ value: "none", label: "—" }, ...MEAL_OPTIONS];
const INDIVIDUAL = "\u0000individual";
const RSVP_TEXT: Record<RsvpStatus, string> = {
  attending: "text-emerald-700 dark:text-emerald-400",
  declined: "text-red-700 dark:text-red-400",
  pending: "text-amber-700 dark:text-amber-400",
};

/** The guest list, banded by household (invitations go to households, not people). */
export function GuestTable({
  guests,
  sideLabel,
  onPatch,
  onRemove,
}: {
  guests: Guest[];
  sideLabel: Record<Guest["side"], string>;
  onPatch: PatchGuest;
  onRemove: (id: string) => void;
}) {
  // Households in first-appearance order; a household's members stay together. People
  // invited on their own share one closing band, so they never read as part of the family above.
  const groups = new Map<string, Guest[]>();
  for (const g of guests) {
    const list = groups.get(g.household);
    if (list) list.push(g);
    else groups.set(g.household, [g]);
  }
  const families = [...groups].filter(([h, m]) => m.length > 1 || h !== fullName(m[0]));
  const singles = [...groups].filter(([h, m]) => m.length === 1 && h === fullName(m[0])).map(([, m]) => m[0]);
  if (singles.length) families.push([INDIVIDUAL, singles]);

  return (
    <Table className="min-w-[860px]">
      <TableHeader>
        <TableRow>
          <TableHead className="w-48">Name</TableHead>
          <TableHead>Side</TableHead>
          <TableHead>List</TableHead>
          <TableHead className="w-32">RSVP</TableHead>
          <TableHead className="w-32">Meal</TableHead>
          <TableHead className="w-36">Dietary</TableHead>
          <TableHead className="w-40">Role</TableHead>
          <TableHead numeric className="w-20">
            Table
          </TableHead>
          <TableHead className="w-10">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {families.map(([household, members]) => (
          <HouseholdRows
            key={household}
            household={household}
            members={members}
            sideLabel={sideLabel}
            onPatch={onPatch}
            onRemove={onRemove}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function HouseholdRows({
  household,
  members,
  sideLabel,
  onPatch,
  onRemove,
}: {
  household: string;
  members: Guest[];
  sideLabel: Record<Guest["side"], string>;
  onPatch: PatchGuest;
  onRemove: (id: string) => void;
}) {
  return (
    <>
      <TableSectionRow>
        <td colSpan={9} className="px-2 text-sm font-semibold">
          {household === INDIVIDUAL ? "Invited individually" : household}
          <span className="ml-2 text-xs font-normal text-muted-foreground">{members.length}</span>
        </td>
      </TableSectionRow>
      {members.map((g) => (
        <GuestRow key={g.id} guest={g} sideLabel={sideLabel} onPatch={onPatch} onRemove={onRemove} />
      ))}
    </>
  );
}

const GuestRow = memo(function GuestRow({
  guest: g,
  sideLabel,
  onPatch,
  onRemove,
}: {
  guest: Guest;
  sideLabel: Record<Guest["side"], string>;
  onPatch: PatchGuest;
  onRemove: (id: string) => void;
}) {
  const name = fullName(g);
  return (
    <TableRow>
      <TableCell className="font-medium">
        {name}
        {g.isChild && <span className="ml-1.5 text-xs font-normal text-muted-foreground">child</span>}
        {g.isPlusOne && <span className="ml-1.5 text-xs font-normal text-muted-foreground">+1</span>}
      </TableCell>
      <TableCell className="text-muted-foreground">{sideLabel[g.side]}</TableCell>
      <TableCell className={g.list === "B" ? "text-muted-foreground" : undefined}>{g.list}</TableCell>
      <TableCell className="py-1">
        <CellSelect
          ariaLabel={`RSVP for ${name}`}
          value={g.rsvp}
          options={RSVP_OPTIONS}
          className={RSVP_TEXT[g.rsvp]}
          onChange={(rsvp) => onPatch(g.id, rsvp === "attending" ? { rsvp } : { rsvp, meal: null, table: null })}
        />
      </TableCell>
      <TableCell className="py-1">
        {g.rsvp === "attending" ? (
          <CellSelect
            ariaLabel={`Meal for ${name}`}
            value={g.meal ?? "none"}
            options={MEAL_WITH_BLANK}
            onChange={(m) => onPatch(g.id, { meal: m === "none" ? null : m })}
          />
        ) : (
          <span className="px-2 text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="py-1">
        <CellText ariaLabel={`Dietary notes for ${name}`} value={g.dietary} placeholder="Allergy…" onCommit={(dietary) => onPatch(g.id, { dietary })} />
      </TableCell>
      <TableCell className="py-1">
        <CellText ariaLabel={`Role for ${name}`} value={g.role} placeholder="Padrino…" onCommit={(role) => onPatch(g.id, { role })} />
      </TableCell>
      <TableCell numeric className="py-1">
        <CellInt ariaLabel={`Table for ${name}`} value={g.table} min={1} onCommit={(table) => onPatch(g.id, { table })} />
      </TableCell>
      <TableCell className="py-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${name}`}
          className={cn("h-8 w-8 text-muted-foreground hover:text-red-600", cellActionClass)}
          onClick={() => onRemove(g.id)}
        >
          <Trash2 />
        </Button>
      </TableCell>
    </TableRow>
  );
});
