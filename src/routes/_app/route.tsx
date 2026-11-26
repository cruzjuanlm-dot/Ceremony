import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  FileText,
  Heart,
  LayoutDashboard,
  Mail,
  PenTool,
  Settings as SettingsIcon,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@libretto-ui/sidebar";
import { SegmentedControl } from "@libretto-ui/segmented-control";

import { useDemoControls, useRows, useWorkspace } from "~/data/hooks";
import type { Plan } from "~/data/types";
import { initials } from "~/lib/format";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  params?: Record<string, string>;
  match?: string[];
  badge?: number;
}

/**
 * The owner's sketch (2026-10) is the IA: Dashboard, Events (weddings), Vendors, Clients,
 * Financials, Calendar & Planner, Email log, Contracts & Documents, Design Studio. One app,
 * two plans: DIY couples own ONE wedding, so "Weddings" collapses to "Our wedding" and
 * Clients disappears — a couple has no clients.
 */
function useNav(plan: Plan, pathname: string): { work: NavItem[]; tools: NavItem[] } {
  const weddings = useRows("weddings");
  const emails = useRows("emails");
  const unread = emails.filter((e) => !e.read && e.direction === "in").length;
  const openId = pathname.match(/\/weddings\/([^/]+)/)?.[1];
  const own = weddings.find((w) => w.id === openId) ?? weddings[0];

  const work: NavItem[] =
    plan === "pro"
      ? [
          { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
          { title: "Weddings", url: "/weddings", icon: Heart },
          { title: "Clients", url: "/clients", icon: Users },
          { title: "Vendors", url: "/vendors", icon: Store },
          { title: "Financials", url: "/financials", icon: Wallet },
        ]
      : [
          { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
          {
            title: "Our wedding",
            url: "/weddings/$weddingId",
            params: { weddingId: own?.id ?? "none" },
            icon: Heart,
            match: ["/weddings"],
          },
          { title: "Vendors", url: "/vendors", icon: Store },
          { title: "Budget & payments", url: "/financials", icon: Wallet },
        ];

  const tools: NavItem[] = [
    { title: "Calendar & planner", url: "/calendar", icon: CalendarDays },
    { title: "Email log", url: "/inbox", icon: Mail, badge: unread || undefined },
    { title: "Contracts & docs", url: "/documents", icon: FileText },
    { title: "Design studio", url: "/studio", icon: PenTool },
  ];
  return { work, tools };
}

function NavGroup({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const paths = item.match ?? [item.url];
            const active = paths.some((u) => pathname === u || pathname.startsWith(u + "/"));
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link to={item.url} params={item.params as never}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function AppLayout() {
  const ws = useWorkspace();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { work, tools } = useNav(ws.plan, pathname);
  const demo = useDemoControls();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarHeader className="px-3 py-4">
            <div className="flex items-center gap-2 px-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary font-display text-lg font-semibold text-primary-foreground">
                C
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="font-display text-lg font-semibold leading-none tracking-tight">
                  Ceremony
                </span>
                <span className="text-xs leading-tight text-muted-foreground">
                  {ws.plan === "pro" ? "Wedding planning studio" : "Our wedding planner"}
                </span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <NavGroup label={ws.plan === "pro" ? "Workspace" : "Planning"} items={work} pathname={pathname} />
            <NavGroup label="Tools" items={tools} pathname={pathname} />
          </SidebarContent>

          <SidebarFooter className="px-3 py-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/settings")} tooltip="Settings">
                  <Link to="/settings">
                    <SettingsIcon className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="mt-1 flex items-center gap-2 px-1 group-data-[collapsible=icon]:hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                {initials(ws.ownerName)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{ws.ownerName}</div>
                <div className="truncate text-xs text-muted-foreground">{ws.name}</div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b bg-background px-4 no-print">
            <SidebarTrigger />
            <div className="hidden text-sm text-muted-foreground sm:block">
              <span className="font-medium text-foreground">{ws.name}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground md:inline">Demo as</span>
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
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
