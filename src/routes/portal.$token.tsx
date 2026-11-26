import { createFileRoute } from "@tanstack/react-router";

import { ClosedPortal, CouplePortalView } from "~/components/portal/couple-view";
import { useRows, useWorkspace } from "~/data/hooks";
import { projectCouplePortal, resolvePortalShare } from "~/lib/portal";

export const Route = createFileRoute("/portal/$token")({
  component: PortalPage,
});

function PortalPage() {
  const { token } = Route.useParams();
  const ws = useWorkspace();
  const weddings = useRows("weddings");
  const shares = useRows("portalShares");
  const vendors = useRows("vendors");
  const bookings = useRows("bookings");
  const timeline = useRows("timeline");
  const tasks = useRows("tasks");
  const documents = useRows("documents");
  const budgetLines = useRows("budgetLines");
  const payments = useRows("payments");
  const guests = useRows("guests");
  const clients = useRows("clients");
  const emails = useRows("emails");

  const share = resolvePortalShare(shares, weddings, token, ws.plan);
  const wedding = share ? weddings.find((w) => w.id === share.weddingId) ?? null : null;
  if (!share || !wedding) return <ClosedPortal reason="missing" />;

  const view = projectCouplePortal({
    share,
    wedding,
    workspaceName: ws.name,
    vendors,
    bookings,
    timeline,
    tasks,
    documents,
    budgetLines,
    payments,
    guests,
    clients,
    emails,
  });

  if (view.closed) return <ClosedPortal reason="off" />;
  return <CouplePortalView view={view} />;
}
