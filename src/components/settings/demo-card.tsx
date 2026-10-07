import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@libretto-ui/alert-dialog";
import { Button } from "@libretto-ui/button";
import { SegmentedControl } from "@libretto-ui/segmented-control";

import { Panel } from "~/components/kit";
import { useDemoControls, useWorkspace } from "~/data/hooks";

export function DemoCard() {
  const ws = useWorkspace();
  const demo = useDemoControls();
  return (
    <Panel title="Demo" bodyClassName="grid gap-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-medium">Demo as</div>
        <SegmentedControl
          aria-label="Demo plan"
          value={ws.plan}
          onValueChange={(p) => p !== ws.plan && demo.switchPlan(p)}
          options={[
            { value: "pro", label: "Planner (Pro)" },
            { value: "diy", label: "Couple (DIY)" },
          ]}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="text-sm font-medium">Demo data</div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              Reset demo data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
              <AlertDialogDescription>
                Every change you've made in the {ws.plan === "pro" ? "planner" : "couple"} demo is replaced with
                the original sample data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => demo.reset()}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Panel>
  );
}
