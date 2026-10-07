import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  Church,
  CircleDollarSign,
  Heart,
  ListChecks,
  MapPin,
  MessagesSquare,
  Phone,
  Scissors,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@libretto-ui/popover";

import { CoupleName } from "~/components/kit";
import { PaymentChip } from "~/components/status";
import type { AppointmentKind } from "~/data/types";
import { dateLong, money, time12 } from "~/lib/format";
import { APPOINTMENT_LABEL } from "~/lib/wedding";
import { cn } from "~/shared/libretto";

import { localParts, type CalItem } from "./items";

export const APPOINTMENT_ICON: Record<AppointmentKind, LucideIcon> = {
  consultation: MessagesSquare,
  venue_visit: MapPin,
  tasting: UtensilsCrossed,
  fitting: Scissors,
  meeting: Users,
  rehearsal: Church,
  call: Phone,
};

export function itemIcon(i: CalItem): LucideIcon {
  switch (i.kind) {
    case "wedding":
      return Heart;
    case "appointment":
      return APPOINTMENT_ICON[i.appointment.kind];
    case "task":
      return i.task.done ? CalendarCheck : ListChecks;
    case "payment":
      return CircleDollarSign;
  }
}

/** Pill colours. Tones keep their fixed meanings: brand = wedding, red/amber = payment state. */
export function itemTone(i: CalItem, today: string): string {
  switch (i.kind) {
    case "wedding":
      return "bg-primary text-primary-foreground";
    case "appointment":
      return "border border-border bg-background text-foreground";
    case "task":
      if (i.task.done) return "text-muted-foreground line-through";
      return i.day < today ? "text-red-700 dark:text-red-400" : "text-foreground";
    case "payment":
      return i.state === "overdue"
        ? "bg-red-500/12 text-red-700 dark:text-red-400"
        : i.state === "due_soon"
          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
          : "text-muted-foreground";
  }
}

export const KIND_LABEL = { wedding: "Wedding", appointment: "Appointment", task: "Task", payment: "Payment" } as const;

/**
 * What a click on an item does: wedding → its page; task → its checklist; payment →
 * Financials; appointment → a details popover (there's no appointment page).
 */
export function ItemAction({ item, className, children }: { item: CalItem; className?: string; children: ReactNode }) {
  const label = `${KIND_LABEL[item.kind]}: ${item.title}`;
  if (item.kind === "appointment") {
    return (
      <Popover>
        <PopoverTrigger className={cn("text-left", className)} aria-label={label}>
          {children}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72">
          <AppointmentDetails item={item} />
        </PopoverContent>
      </Popover>
    );
  }
  if (item.kind === "payment") {
    return (
      <Link to="/financials" className={className} aria-label={label}>
        {children}
      </Link>
    );
  }
  if (item.weddingId) {
    return (
      <Link
        to="/weddings/$weddingId"
        params={{ weddingId: item.weddingId }}
        search={(item.kind === "task" ? { tab: "checklist" } : {}) as never}
        className={className}
        aria-label={label}
      >
        {children}
      </Link>
    );
  }
  return <span className={className}>{children}</span>;
}

export function AppointmentDetails({ item }: { item: Extract<CalItem, { kind: "appointment" }> }) {
  const a = item.appointment;
  const Icon = APPOINTMENT_ICON[a.kind];
  const end = localParts(a.end);
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {APPOINTMENT_LABEL[a.kind]}
      </div>
      <div className="font-semibold leading-snug">{a.title}</div>
      <div>
        {dateLong(item.day)}
        <div className="text-muted-foreground">
          {time12(item.time)}
          {end.day === item.day && ` – ${time12(end.time)}`}
        </div>
      </div>
      {a.location && (
        <div className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          {a.location}
        </div>
      )}
      {item.weddingId && item.weddingTitle && (
        <Link to="/weddings/$weddingId" params={{ weddingId: item.weddingId }} className="inline-block hover:underline">
          <CoupleName>{item.weddingTitle}</CoupleName>
        </Link>
      )}
    </div>
  );
}

/** One compact line for a month cell. */
export function ItemPill({ item, today }: { item: CalItem; today: string }) {
  const Icon = itemIcon(item);
  return (
    <ItemAction
      item={item}
      className={cn(
        "flex w-full min-w-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] leading-4 hover:opacity-80",
        itemTone(item, today),
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {item.time && item.kind === "appointment" && <span className="shrink-0 tabular-nums">{time12(item.time)}</span>}
      <span className={cn("truncate", item.kind === "wedding" && "font-display font-semibold")}>{item.title}</span>
    </ItemAction>
  );
}

/** A full-width row, used in the agenda and the day popover. */
export function ItemRow({ item, today, leading }: { item: CalItem; today: string; leading?: ReactNode }) {
  const Icon = itemIcon(item);
  const sub =
    item.kind === "appointment"
      ? [item.appointment.location, item.weddingTitle].filter(Boolean).join(" · ")
      : item.kind === "wedding"
        ? item.wedding.city
        : item.weddingTitle;
  return (
    <div className="flex items-center gap-3 py-2">
      {leading ?? (
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            item.kind === "wedding" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}
      <ItemAction item={item} className="min-w-0 flex-1 rounded-sm hover:underline underline-offset-2">
        <div
          className={cn(
            "truncate text-sm",
            item.kind === "wedding" && "font-display text-base font-semibold",
            item.kind === "task" && item.task.done && "text-muted-foreground line-through",
            item.kind === "task" && !item.task.done && item.day < today && "text-red-700 dark:text-red-400",
          )}
        >
          {item.title}
        </div>
        {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
      </ItemAction>
      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        {item.kind === "payment" && (
          <>
            <span className="tabular-nums text-foreground">{money(item.payment.amount)}</span>
            <PaymentChip state={item.state} />
          </>
        )}
        {item.kind !== "payment" && item.time && <span className="tabular-nums">{time12(item.time)}</span>}
        {item.kind === "task" && <span className="hidden sm:inline">{KIND_LABEL.task}</span>}
      </div>
    </div>
  );
}
