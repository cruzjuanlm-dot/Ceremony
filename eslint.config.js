import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "src/routeTree.gen.ts"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "off",
      // The doorway rule (ceremony/CLAUDE.md): Ceremony may borrow Libretto's design layer
      // via `@libretto-ui/*` and src/shared/ only. Never Libretto's domain code.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*", "../../src/*", "../../../src/*"],
              message:
                "Import Libretto code only through @libretto-ui/* or ~/shared/libretto (the doorway).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared/**"],
    rules: { "no-restricted-imports": "off" },
  },
);
