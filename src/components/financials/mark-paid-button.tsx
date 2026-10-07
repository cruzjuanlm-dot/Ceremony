import { Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@libretto-ui/button";

import { useUpdate } from "~/data/hooks";
import type { Payment } from "~/data/types";
import { todayIso } from "~/lib/finance";
import { dateShort } from "~/lib/format";
import { cellActionClass, cn } from "~/shared/libretto";

/** "Mark paid" — stamps today and a manual method. Paid rows show the paid date instead. */
export function MarkPaidButton({ payment, alwaysVisible }: { payment: Payment; alwaysVisible?: boolean }) {
  const update = useUpdate("payments");
  if (payment.paidDate) {
    return <span className="text-xs text-muted-foreground">Paid {dateShort(payment.paidDate)}</span>;
  }
  return (
    <Button
      size="sm"
      variant="outline"
      className={cn("h-7 px-2 text-xs", !alwaysVisible && cellActionClass)}
      disabled={update.isPending}
      onClick={(e) => {
        e.stopPropagation();
        update.mutate(
          { id: payment.id, patch: { paidDate: todayIso(), method: "Manual" } },
          { onSuccess: () => toast.success(`${payment.label} marked paid`) },
        );
      }}
    >
      <Check className="mr-1 h-3.5 w-3.5" />
      Mark paid
    </Button>
  );
}
