import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@libretto-ui/dialog";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { useInsert } from "~/data/hooks";
import type { Vendor, VenueQuote, Wedding } from "~/data/types";

import { blankQuote } from "./quote-helpers";

const NEW_VENUE = "__new";

export function AddQuoteButton({
  wedding: w,
  vendors,
  quotes,
  onAdded,
}: {
  wedding: Wedding;
  vendors: Vendor[];
  quotes: VenueQuote[];
  onAdded: (id: string) => void;
}) {
  const insert = useInsert("venueQuotes");
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState("");
  const [name, setName] = useState("");

  const quoted = new Set(quotes.map((q) => q.vendorId));
  const venues = vendors
    .filter((v) => v.category === "venue" && !quoted.has(v.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const isNew = choice === NEW_VENUE || venues.length === 0;
  const picked = venues.find((v) => v.id === choice);
  const venueName = isNew ? name.trim() : (picked?.name ?? "");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!venueName) return;
    const row = await insert.mutateAsync(blankQuote(w, venueName, isNew ? null : (picked?.id ?? null)));
    setOpen(false);
    setChoice("");
    setName("");
    onAdded(row.id);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add quote
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add venue quote</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4">
          {venues.length > 0 && (
            <div className="grid gap-1.5">
              <Label>Venue</Label>
              <Select value={choice} onValueChange={setChoice}>
                <SelectTrigger aria-label="Venue">
                  <SelectValue placeholder="Choose from your directory" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                      {v.capacity != null && ` · holds ${v.capacity}`}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_VENUE}>A venue not in the directory…</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {isNew && (
            <div className="grid gap-1.5">
              <Label htmlFor="aq-name">Venue name</Label>
              <Input id="aq-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={!venueName || insert.isPending}>
              Add quote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
