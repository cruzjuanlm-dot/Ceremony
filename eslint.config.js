import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "src/routeTree.gen.ts", "src/libretto"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "off",
      // The doorway rule (CLAUDE.md): Ceremony uses the vendored Libretto design layer
      // via `@libretto-ui/*` and src/shared/ only.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*"],
              message:
                "Import Libretto code only through @libretto-ui/* or ~/shared/libretto (the doorway).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared/**", "src/libretto/**"],
    rules: { "no-restricted-imports": "off" },
  },
);
