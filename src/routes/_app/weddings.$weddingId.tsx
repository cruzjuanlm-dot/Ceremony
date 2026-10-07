import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@libretto-ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@libretto-ui/tabs";

import { EmptyState } from "~/components/kit";
import { BudgetTab } from "~/components/wedding/budget-tab";
import { ChecklistTab } from "~/components/wedding/checklist-tab";
import { DocumentsTab } from "~/components/wedding/documents-tab";
import { GuestsTab } from "~/components/wedding/guests-tab";
import { LogisticsTab } from "~/components/wedding/logistics-tab";
import { OverviewTab } from "~/components/wedding/overview-tab";
import { TimelineTab } from "~/components/wedding/timeline-tab";
import { VendorsTab } from "~/components/wedding/vendors-tab";
import { WeddingHeader } from "~/components/wedding/wedding-header";
import { WEDDING_TABS, type WeddingTab } from "~/components/wedding/wedding-helpers";
import { useWedding, useWorkspace } from "~/data/hooks";

export const Route = createFileRoute("/_app/weddings/$weddingId")({
  validateSearch: (search: Record<string, unknown>): { tab?: WeddingTab } =>
    WEDDING_TABS.includes(search.tab as WeddingTab) && search.tab !== "overview"
      ? { tab: search.tab as WeddingTab }
      : {},
  component: WeddingPage,
});

const TAB_LABEL: Record<WeddingTab, string> = {
  overview: "Overview",
  budget: "Budget",
  guests: "Guests",
  timeline: "Timeline",
  vendors: "Vendors",
  checklist: "Checklist",
  logistics: "Logistics",
  documents: "Documents",
};

function WeddingPage() {
  const { weddingId } = Route.useParams();
  const { tab = "overview" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const ws = useWorkspace();
  const wedding = useWedding(weddingId);

  if (!wedding) {
    return (
      <div className="mx-auto max-w-6xl pt-8">
        <EmptyState
          title="Wedding not found"
          action={
            <Button asChild variant="outline">
              <Link to={ws.plan === "pro" ? "/weddings" : "/dashboard"}>
                {ws.plan === "pro" ? "Back to weddings" : "Back to dashboard"}
              </Link>
            </Button>
          }
        >
          It may have been removed, or the link is from another workspace.
        </EmptyState>
      </div>
    );
  }

  const setTab = (v: string) =>
    navigate({
      search: (prev) => ({ ...prev, tab: v === "overview" ? undefined : (v as WeddingTab) }),
      replace: true,
    });

  const goTo = (t: WeddingTab) => setTab(t);

  return (
    <div className="mx-auto max-w-6xl">
      <WeddingHeader wedding={wedding} />
      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <TabsList className="w-max justify-start">
            {WEDDING_TABS.map((t) => (
              <TabsTrigger key={t} value={t}>
                {TAB_LABEL[t]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="overview" className="mt-5">
          <OverviewTab wedding={wedding} onOpenTab={goTo} />
        </TabsContent>
        <TabsContent value="budget" className="mt-5">
          <BudgetTab wedding={wedding} />
        </TabsContent>
        <TabsContent value="guests" className="mt-5">
          <GuestsTab wedding={wedding} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-5">
          <TimelineTab wedding={wedding} />
        </TabsContent>
        <TabsContent value="vendors" className="mt-5">
          <VendorsTab wedding={wedding} />
        </TabsContent>
        <TabsContent value="checklist" className="mt-5">
          <ChecklistTab wedding={wedding} />
        </TabsContent>
        <TabsContent value="logistics" className="mt-5">
          <LogisticsTab wedding={wedding} />
        </TabsContent>
        <TabsContent value="documents" className="mt-5">
          <DocumentsTab wedding={wedding} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
