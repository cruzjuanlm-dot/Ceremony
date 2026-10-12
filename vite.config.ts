import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Ceremony is a plain Vite SPA (demo mode — no server, no Supabase yet).
 *
 *  - `~/`            → src (Ceremony's own code)
 *  - `@libretto-ui/` → src/libretto/components/ui (the shadcn primitives vendored from Libretto)
 *  - `@/`            → src/libretto — exists ONLY so the vendored primitives can resolve their own
 *                      internal imports (`@/lib/utils`, `@/hooks/use-mobile`). Ceremony code
 *                      must not import `@/` outside src/shared/ (lint-enforced).
 *
 * src/libretto/ is a COPY of Libretto's design layer, taken when Ceremony moved out of the
 * Libretto repo (2026-10-12). It no longer updates itself — see CLAUDE.md "The doorway".
 */
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      { find: /^~\//, replacement: here("./src/") },
      { find: /^@libretto-ui\//, replacement: here("./src/libretto/components/ui/") },
      { find: /^@\//, replacement: here("./src/libretto/") },
    ],
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  server: { port: 8081 },
  preview: { port: 8081 },
});
