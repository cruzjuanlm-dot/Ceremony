import { ExternalLink } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libretto-ui/table";

import { EmptyState } from "~/components/kit";
import { DocStatusChip } from "~/components/status";
import { useRows } from "~/data/hooks";
import type { Wedding } from "~/data/types";
import { dateShort, money } from "~/lib/format";
import { DOC_KIND_LABEL } from "~/lib/wedding";

/** This wedding's contracts, proposals, licenses… (plus its client's unlinked documents). */
export function DocumentsTab({ wedding: w }: { wedding: Wedding }) {
  const docs = useRows("documents")
    .filter((d) => d.weddingId === w.id || (!d.weddingId && w.clientId != null && d.clientId === w.clientId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const vendors = useRows("vendors");

  if (docs.length === 0) {
    return <EmptyState title="No documents yet">Contracts and proposals linked to this wedding show up here.</EmptyState>;
  }

  return (
    <Table className="min-w-[640px]">
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Kind</TableHead>
          <TableHead>Vendor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead numeric>Amount</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead>
            <span className="sr-only">Link</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {docs.map((d) => {
          const vendor = d.vendorId ? vendors.find((v) => v.id === d.vendorId) : undefined;
          return (
            <TableRow key={d.id}>
              <TableCell className="max-w-72 truncate font-medium">{d.title}</TableCell>
              <TableCell className="text-muted-foreground">{DOC_KIND_LABEL[d.kind]}</TableCell>
              <TableCell className="max-w-48 truncate text-muted-foreground">{vendor?.name ?? "—"}</TableCell>
              <TableCell>
                <DocStatusChip status={d.status} />
              </TableCell>
              <TableCell numeric>{money(d.amount)}</TableCell>
              <TableCell className="text-muted-foreground">{dateShort(d.updatedAt.slice(0, 10))}</TableCell>
              <TableCell className="text-right">
                {d.url ? (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Open
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
