import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { useUpdate } from "~/data/hooks";
import type { Client, ClientStatus } from "~/data/types";
import { CLIENT_STATUS_LABEL } from "~/lib/wedding";
import { cellTriggerClass, cn } from "~/shared/libretto";

import { STATUS_OPTIONS } from "./client-sheet";

/** Ghost status select for cards and rows. Wrapped so its clicks never open the sheet. */
export function ClientStatusSelect({ client, className }: { client: Client; className?: string }) {
  const update = useUpdate("clients");
  return (
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Select
        value={client.status}
        onValueChange={(v) => update.mutate({ id: client.id, patch: { status: v as ClientStatus } })}
      >
        <SelectTrigger
          aria-label={`Status for ${client.partner1}`}
          className={cn(cellTriggerClass, "h-7 w-auto gap-1 px-1.5 text-xs [&>svg]:opacity-40", className)}
        >
          <SelectValue>{CLIENT_STATUS_LABEL[client.status]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
