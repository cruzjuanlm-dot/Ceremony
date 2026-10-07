/**
 * THE DOORWAY. Everything Ceremony borrows from Libretto that is NOT a `@libretto-ui/*`
 * primitive is re-exported from here, and only from here (lint-enforced). Allowed: the design
 * layer — class helpers, the page header, the in-cell control recipes. NOT allowed: anything
 * domain (finance.ts, Supabase clients, Libretto's pages/sidebar content).
 *
 * If Ceremony is ever split into its own repo, this file plus the `@libretto-ui` alias are
 * the whole seam: vendor or package those, and nothing else changes.
 */
export { cn } from "@/lib/utils";
export { PageHeader, BackButton } from "@/components/page-header";
export {
  cellControlClass,
  cellTriggerClass,
  cellActionClass,
} from "@/components/cell-control-classes";
