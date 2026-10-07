import { useState } from "react";

import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { Panel } from "~/components/kit";
import { useUpdateWorkspace, useWorkspace } from "~/data/hooks";
import type { Workspace } from "~/data/types";

type Field = "name" | "ownerName" | "ownerEmail" | "city";

/** One workspace field, edited in place — blur (or Enter) commits. */
function WorkspaceField({ field, label, type = "text" }: { field: Field; label: string; type?: string }) {
  const ws = useWorkspace();
  const update = useUpdateWorkspace();
  const [value, setValue] = useState(ws[field]);
  const id = `ws-${field}`;
  const commit = () => {
    const next = value.trim();
    if (!next) return setValue(ws[field]);
    if (next !== ws[field]) update.mutate({ [field]: next } as Partial<Workspace>);
  };
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      />
    </div>
  );
}

export function WorkspaceCard() {
  const ws = useWorkspace();
  const pro = ws.plan === "pro";
  return (
    <Panel title="Workspace" bodyClassName="grid gap-4 py-4 sm:grid-cols-2">
      <WorkspaceField field="name" label={pro ? "Business name" : "Wedding name"} />
      <WorkspaceField field="ownerName" label="Your name" />
      <WorkspaceField field="ownerEmail" label="Email" type="email" />
      <WorkspaceField field="city" label="City" />
      <div className="grid gap-1.5">
        <Label>Language</Label>
        <Select value="en" disabled>
          <SelectTrigger aria-label="Language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">Español — coming soon</span>
      </div>
    </Panel>
  );
}
