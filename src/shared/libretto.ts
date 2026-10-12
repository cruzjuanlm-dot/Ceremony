/**
 * THE DOORWAY. Everything Ceremony borrows from Libretto that is NOT a `@libretto-ui/*`
 * primitive is re-exported from here, and only from here (lint-enforced). Allowed: the design
 * layer — class helpers, the page header, the in-cell control recipes. NOT allowed: anything
 * domain (finance.ts, Supabase clients, Libretto's pages/sidebar content).
 *
 * Since the split into its own repo (2026-10-12) these resolve to the vendored copy in
 * src/libretto/, not to Libretto itself.
 */
export { cn } from "@/lib/utils";
export { PageHeader, BackButton } from "@/components/page-header";
export {
  cellControlClass,
  cellTriggerClass,
  cellActionClass,
} from "@/components/cell-control-classes";
