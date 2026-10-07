import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@libretto-ui/dialog";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { useInsert } from "~/data/hooks";
import type { Guest, MealChoice, RsvpStatus, Wedding } from "~/data/types";

import { MEAL_OPTIONS, RSVP_OPTIONS } from "./couple";

const EMPTY = {
  firstName: "",
  lastName: "",
  household: "",
  side: "partner1" as Guest["side"],
  list: "A" as Guest["list"],
  rsvp: "pending" as RsvpStatus,
  meal: "none" as MealChoice | "none",
  role: "",
  email: "",
};

/** "Add guest" — a guest is a child of the wedding (DESIGN_LANGUAGE §1: Add). */
export function AddGuestButton({
  wedding,
  sideLabel,
  households,
}: {
  wedding: Wedding;
  sideLabel: Record<Guest["side"], string>;
  households: string[];
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const insert = useInsert("guests");
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim()) return;
    await insert.mutateAsync({
      weddingId: wedding.id,
      household: form.household.trim() || name,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      side: form.side,
      list: form.list,
      rsvp: form.rsvp,
      meal: form.rsvp === "attending" && form.meal !== "none" ? form.meal : null,
      dietary: "",
      isPlusOne: false,
      isChild: form.meal === "kids",
      role: form.role.trim(),
      table: null,
      email: form.email.trim(),
    });
    setForm(EMPTY);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          Add guest
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add guest</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ag-first">First name</Label>
              <Input id="ag-first" autoFocus value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ag-last">Last name</Label>
              <Input id="ag-last" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ag-household">Household</Label>
            <Input
              id="ag-household"
              list="ag-households"
              placeholder={name || "The Rivera family"}
              value={form.household}
              onChange={(e) => set("household", e.target.value)}
            />
            <datalist id="ag-households">
              {households.map((h) => (
                <option key={h} value={h} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Side</Label>
              <Select value={form.side} onValueChange={(v) => set("side", v as Guest["side"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["partner1", "partner2", "both"] as const).map((s) => (
                    <SelectItem key={s} value={s}>
                      {sideLabel[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>List</Label>
              <Select value={form.list} onValueChange={(v) => set("list", v as Guest["list"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A list</SelectItem>
                  <SelectItem value="B">B list</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>RSVP</Label>
              <Select value={form.rsvp} onValueChange={(v) => set("rsvp", v as RsvpStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RSVP_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.rsvp === "attending" && (
              <div className="grid gap-1.5">
                <Label>Meal</Label>
                <Select value={form.meal} onValueChange={(v) => set("meal", v as MealChoice | "none")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not chosen</SelectItem>
                    {MEAL_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ag-role">Role</Label>
              <Input id="ag-role" placeholder="Madrina" value={form.role} onChange={(e) => set("role", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ag-email">Email</Label>
              <Input id="ag-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!form.firstName.trim() || insert.isPending}>
              Add guest
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
