import { useState } from "react";
import { Plus } from "lucide-react";

import { Checkbox } from "@libretto-ui/checkbox";
import { Input } from "@libretto-ui/input";
import { SegmentedControl } from "@libretto-ui/segmented-control";

import { Chip, EmptyState, Meter, type Tone } from "~/components/kit";
import { useInsert, useUpdate, useWeddingRows, useWorkspace } from "~/data/hooks";
import type { Task, TaskOwner, Wedding } from "~/data/types";
import { todayIso } from "~/lib/finance";
import { dateShort } from "~/lib/format";
import { cn } from "~/shared/libretto";

import { CellText } from "./fields";
import { PHASE_ORDER } from "./wedding-helpers";

type Lens = "open" | "all" | "done";

const OWNER_LABEL: Record<TaskOwner, string> = { planner: "Planner", couple: "Couple", vendor: "Vendor" };
const OWNER_TONE: Record<TaskOwner, Tone> = { planner: "brand", couple: "info", vendor: "muted" };

export function ChecklistTab({ wedding: w }: { wedding: Wedding }) {
  const ws = useWorkspace();
  const tasks = useWeddingRows("tasks", w.id);
  const [lens, setLens] = useState<Lens>("open");
  const today = todayIso();

  const done = tasks.filter((t) => t.done).length;
  const overdue = tasks.filter((t) => !t.done && t.dueDate && t.dueDate < today).length;

  const phases = [...PHASE_ORDER];
  for (const t of tasks) if (!phases.includes(t.phase)) phases.push(t.phase);

  const visible = (t: Task) => (lens === "all" ? true : lens === "done" ? t.done : !t.done);
  const groups = phases
    .map((phase) => ({
      phase,
      tasks: tasks
        .filter((t) => t.phase === phase && visible(t))
        .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")),
    }))
    .filter((g) => g.tasks.length > 0 || (lens === "all" && PHASE_ORDER.includes(g.phase)));

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="grid grid-cols-1 gap-4 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0 sm:w-80">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold tabular-nums">
              {done} of {tasks.length} done
            </span>
            {overdue > 0 && <span className="text-xs text-red-600 dark:text-red-400">{overdue} overdue</span>}
          </div>
          <Meter className="mt-2" label="Checklist progress" value={done} max={tasks.length} />
        </div>
        <SegmentedControl
          aria-label="Which tasks"
          value={lens}
          onValueChange={setLens}
          options={[
            { value: "open", label: "Open" },
            { value: "all", label: "All" },
            { value: "done", label: "Done" },
          ]}
        />
      </div>

      {groups.length === 0 ? (
        <EmptyState title={lens === "done" ? "Nothing checked off yet" : "Everything's done"} />
      ) : (
        groups.map((g) => (
          <PhaseGroup key={g.phase} phase={g.phase} tasks={g.tasks} wedding={w} today={today} showOwner={ws.plan === "pro"} />
        ))
      )}
    </div>
  );
}

function PhaseGroup({
  phase,
  tasks,
  wedding,
  today,
  showOwner,
}: {
  phase: string;
  tasks: Task[];
  wedding: Wedding;
  today: string;
  showOwner: boolean;
}) {
  const update = useUpdate("tasks");
  const insert = useInsert("tasks");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  const add = () => {
    const t = title.trim();
    if (!t) {
      setAdding(false);
      return;
    }
    insert.mutate({
      weddingId: wedding.id,
      title: t,
      dueDate: null,
      done: false,
      owner: showOwner ? "planner" : "couple",
      phase,
    });
    setTitle("");
  };

  return (
    <section aria-label={phase}>
      <h3 className="border-b pb-1.5 text-sm font-semibold">{phase}</h3>
      <ul>
        {tasks.map((t) => {
          const late = !t.done && t.dueDate != null && t.dueDate < today;
          return (
            <li key={t.id} className="group flex items-center gap-3 border-b border-border/60 py-1.5 pl-1 hover:bg-muted/50">
              <Checkbox
                checked={t.done}
                aria-label={t.done ? `Mark "${t.title}" not done` : `Mark "${t.title}" done`}
                onCheckedChange={(v) => update.mutate({ id: t.id, patch: { done: v === true } })}
              />
              <span className={cn("min-w-0 flex-1 truncate text-sm", t.done && "text-muted-foreground line-through")}>{t.title}</span>
              {showOwner && (
                <Chip tone={OWNER_TONE[t.owner]} className="hidden sm:inline-flex">
                  {OWNER_LABEL[t.owner]}
                </Chip>
              )}
              <div className={cn("w-32 shrink-0 text-right text-sm", late && "text-red-600 dark:text-red-400")}>
                {t.done ? (
                  <span className="pr-2 text-muted-foreground">{dateShort(t.dueDate)}</span>
                ) : (
                  <CellText
                    type="date"
                    ariaLabel={`Due date for ${t.title}`}
                    value={t.dueDate ?? ""}
                    display={t.dueDate ? dateShort(t.dueDate) : "Set date"}
                    onCommit={(v) => update.mutate({ id: t.id, patch: { dueDate: v || null } })}
                    className={cn("h-7 text-right", late && "text-red-600 dark:text-red-400", !t.dueDate && "text-muted-foreground/60")}
                  />
                )}
                {late && <span className="sr-only">Overdue</span>}
              </div>
            </li>
          );
        })}
      </ul>
      {adding ? (
        <div className="flex items-center gap-3 py-1.5 pl-1">
          <Checkbox disabled aria-hidden="true" />
          <Input
            autoFocus
            aria-label={`New task for ${phase}`}
            placeholder="Task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
              if (e.key === "Escape") {
                setTitle("");
                setAdding(false);
              }
            }}
            onBlur={() => {
              add();
              setAdding(false);
            }}
            className="h-8"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-1 flex items-center gap-1.5 rounded px-1 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Add task
        </button>
      )}
    </section>
  );
}
