import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { cn } from "~/shared/libretto";

export type WeddingTab =
  | "overview"
  | "budget"
  | "guests"
  | "timeline"
  | "vendors"
  | "checklist"
  | "logistics"
  | "documents";

/**
 * A link into one wedding, optionally landing on a tab. The wedding page reads `?tab=`;
 * the cast keeps this compiling until that route declares its search schema.
 */
export function WeddingLink({
  weddingId,
  tab,
  className,
  children,
  stop,
}: {
  weddingId: string;
  tab?: WeddingTab;
  className?: string;
  children: ReactNode;
  /** Stop the click reaching a clickable parent row. */
  stop?: boolean;
}) {
  return (
    <Link
      to="/weddings/$weddingId"
      params={{ weddingId }}
      search={(tab ? { tab } : {}) as never}
      className={cn("hover:underline underline-offset-2", className)}
      onClick={stop ? (e) => e.stopPropagation() : undefined}
    >
      {children}
    </Link>
  );
}
