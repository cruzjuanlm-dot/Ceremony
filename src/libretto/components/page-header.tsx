import type { ReactNode } from "react";
import { useCanGoBack, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * The one page header (DESIGN_LANGUAGE): title + description on the left, actions on the
 * right, same type scale and spacing on every view. Before this, the six top-level pages
 * had five hand-rolled header blocks disagreeing on margins and wrap behavior.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/**
 * "Take me back to where I was." Real browser history when there is in-app history to go
 * back to (so a promoter who arrived from the Dashboard returns to the Dashboard), falling
 * back to the object's list for direct links and fresh tabs. Every detail page renders this
 * in the same spot, styled the same way.
 */
export function BackButton({
  fallbackTo,
  fallbackSearch,
  className,
}: {
  /** Where to go when this page IS the start of history (deep link, refresh). */
  fallbackTo: string;
  fallbackSearch?: Record<string, unknown>;
  className?: string;
}) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-2 h-8 px-2 text-muted-foreground hover:text-foreground", className)}
      onClick={() => {
        if (canGoBack) router.history.back();
        else router.navigate({ to: fallbackTo, search: fallbackSearch } as never);
      }}
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      Back
    </Button>
  );
}
