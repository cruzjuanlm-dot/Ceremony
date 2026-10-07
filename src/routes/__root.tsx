import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

import { Toaster } from "@libretto-ui/sonner";
import { Button } from "@libretto-ui/button";

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster />
    </>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="font-display text-3xl">Page not found</h1>
      <Button asChild variant="outline">
        <Link to="/dashboard">Go to the dashboard</Link>
      </Button>
    </div>
  ),
});
