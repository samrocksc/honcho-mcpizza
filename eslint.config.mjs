import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "node_modules"]),

  {
    files: ["src/**/*.ts"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "quotes": ["error", "double"],
      "semi": ["error", "always"],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],

      // No interfaces - use types instead
      "no-restricted-syntax": [
        "error",
        {
          "selector": "TSInterfaceDeclaration",
          "message": "Use 'type' instead of 'interface'."
        },
      ],
    },
  },

  {
    files: ["src/tools/index.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
