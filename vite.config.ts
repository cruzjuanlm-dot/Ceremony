import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Ceremony is a plain Vite SPA (demo mode — no server, no Supabase yet) that lives inside the
 * Libretto repo and borrows Libretto's design layer. See ceremony/CLAUDE.md "The doorway".
 *
 *  - `~/`            → ceremony/src (Ceremony's own code)
 *  - `@libretto-ui/` → ../src/components/ui (Libretto's shadcn primitives — the shared layer)
 *  - `@/`            → ../src — exists ONLY so the borrowed primitives can resolve their own
 *                      internal imports (`@/lib/utils`, `@/hooks/use-mobile`). Ceremony code
 *                      must not import `@/` outside src/shared/ (lint-enforced).
 *
 * Dependencies resolve from the repo-root node_modules (Ceremony declares none of its own),
 * which guarantees ONE copy of React/Radix/Tailwind across both apps' components.
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
      { find: /^@libretto-ui\//, replacement: here("../src/components/ui/") },
      { find: /^@\//, replacement: here("../src/") },
    ],
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  server: { port: 8081 },
  preview: { port: 8081 },
});
