import type { ReactNode } from "react";

/**
 * A one-line cue on a phone, where a wide table scrolls sideways.
 * Hidden from the `sm` breakpoint up, where the columns fit.
 */
export function PhoneScrollHint({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0 max-w-full">
      <p className="mb-1.5 text-xs text-muted-foreground sm:hidden">Swipe sideways to see every column.</p>
      <div className="max-w-full overflow-x-auto">{children}</div>
    </div>
  );
}
