import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@libretto-ui/dialog";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";

import { useInsert } from "~/data/hooks";
import type { Wedding } from "~/data/types";
import { addDaysIso, todayIso } from "~/lib/finance";

export function AddRoomBlockButton({ wedding }: { wedding: Wedding }) {
  const [open, setOpen] = useState(false);
  const insert = useInsert("roomBlocks");
  const blank = () => ({
    hotel: "",
    rate: "",
    roomsHeld: "20",
    cutoffDate: wedding.date ? addDaysIso(wedding.date, -30) : addDaysIso(todayIso(), 60),
    bookingLink: "",
  });
  const [form, setForm] = useState(blank);
  const set = (k: keyof ReturnType<typeof blank>) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hotel.trim() || !form.cutoffDate) return;
    await insert.mutateAsync({
      weddingId: wedding.id,
      hotel: form.hotel.trim(),
      rate: Number(form.rate) || 0,
      roomsHeld: Math.max(0, Math.trunc(Number(form.roomsHeld) || 0)),
      roomsBooked: 0,
      cutoffDate: form.cutoffDate,
      bookingLink: form.bookingLink.trim(),
    });
    setForm(blank());
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus />
          Add room block
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add room block</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="rb-hotel">Hotel</Label>
            <Input id="rb-hotel" autoFocus value={form.hotel} onChange={set("hotel")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="rb-rate">Nightly rate</Label>
              <Input id="rb-rate" inputMode="decimal" placeholder="$" value={form.rate} onChange={set("rate")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rb-held">Rooms held</Label>
              <Input id="rb-held" inputMode="numeric" value={form.roomsHeld} onChange={set("roomsHeld")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rb-cutoff">Cutoff</Label>
              <Input id="rb-cutoff" type="date" value={form.cutoffDate} onChange={set("cutoffDate")} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rb-link">Booking link</Label>
            <Input id="rb-link" type="url" placeholder="https://" value={form.bookingLink} onChange={set("bookingLink")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!form.hotel.trim() || !form.cutoffDate || insert.isPending}>
              Add room block
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
