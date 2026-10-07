import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@libretto-ui/dialog";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { SegmentedControl } from "@libretto-ui/segmented-control";

import { useInsert, useRows, useWorkspace } from "~/data/hooks";
import type { PaymentDirection } from "~/data/types";
import { addDaysIso, todayIso } from "~/lib/finance";

/**
 * "Add payment" (DESIGN_LANGUAGE §1: Add = a line on something that exists — a wedding).
 * Pro picks the ledger: Income (couple → planner) or Vendor bill (→ a booked vendor).
 * DIY payments are always vendor bills.
 */
export function AddPaymentButton({
  defaultDirection = "outgoing",
  weddingId: fixedWeddingId,
  variant = "default",
}: {
  defaultDirection?: PaymentDirection;
  weddingId?: string;
  variant?: "default" | "outline";
}) {
  const ws = useWorkspace();
  const weddings = useRows("weddings");
  const bookings = useRows("bookings");
  const vendors = useRows("vendors");
  const insert = useInsert("payments");
  const [open, setOpen] = useState(false);

  const blank = () => ({
    weddingId: fixedWeddingId ?? (ws.plan === "diy" ? (weddings[0]?.id ?? "") : ""),
    direction: (ws.plan === "diy" ? "outgoing" : defaultDirection) as PaymentDirection,
    bookingId: "",
    label: "",
    amount: "",
    dueDate: addDaysIso(todayIso(), 14),
  });
  const [form, setForm] = useState(blank);
  const set = <K extends keyof ReturnType<typeof blank>>(k: K, v: ReturnType<typeof blank>[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const weddingBookings = bookings
    .filter((b) => b.weddingId === form.weddingId && b.stage !== "declined")
    .map((b) => ({ b, v: vendors.find((v) => v.id === b.vendorId) }))
    .filter((x) => x.v);

  const amount = Number(form.amount);
  const valid =
    form.weddingId &&
    form.label.trim() &&
    amount > 0 &&
    form.dueDate &&
    (form.direction === "incoming" || form.bookingId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    await insert.mutateAsync({
      weddingId: form.weddingId,
      direction: form.direction,
      bookingId: form.direction === "outgoing" ? form.bookingId : null,
      label: form.label.trim(),
      amount,
      dueDate: form.dueDate,
      paidDate: null,
      method: null,
    });
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setForm(blank());
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Plus className="mr-2 h-4 w-4" />
          Add payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          {ws.plan === "pro" && (
            <SegmentedControl
              aria-label="Ledger"
              value={form.direction}
              onValueChange={(v) => set("direction", v)}
              options={[
                { value: "incoming", label: "Planner income" },
                { value: "outgoing", label: "Vendor bill" },
              ]}
            />
          )}
          {!fixedWeddingId && ws.plan === "pro" && (
            <div className="grid gap-1.5">
              <Label>Wedding</Label>
              <Select
                value={form.weddingId || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, weddingId: v, bookingId: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a wedding" />
                </SelectTrigger>
                <SelectContent>
                  {weddings.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {form.direction === "outgoing" && (
            <div className="grid gap-1.5">
              <Label>Vendor</Label>
              <Select value={form.bookingId || undefined} onValueChange={(v) => set("bookingId", v)} disabled={!form.weddingId}>
                <SelectTrigger>
                  <SelectValue placeholder={weddingBookings.length ? "Choose a vendor" : "No vendors on this wedding"} />
                </SelectTrigger>
                <SelectContent>
                  {weddingBookings.map(({ b, v }) => (
                    <SelectItem key={b.id} value={b.id}>
                      {v!.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="ap-label">Label</Label>
            <Input
              id="ap-label"
              placeholder={form.direction === "incoming" ? "Final installment" : "Deposit"}
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ap-amount">Amount</Label>
              <Input id="ap-amount" inputMode="decimal" placeholder="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ap-due">Due</Label>
              <Input id="ap-due" type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!valid || insert.isPending}>
              Add payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
