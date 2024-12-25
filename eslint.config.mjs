import pluginJs from "@eslint/js";
import prettier from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ["dist/"] },
  {
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node, // Node.js-specific globals
    },
    plugins: {
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,
      prettier: prettier,
    },
    rules: {
      // Shared rules
      "no-duplicate-imports": "warn",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "max-len": [
        "error",
        {
          code: 120,
          ignoreRegExpLiterals: true,
          tabWidth: 2,
        },
      ],
      "no-console": "warn",
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
        },
      ],
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["*.ts"],
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^@?\\w"], // Packages
            ["^"], // Absolute imports
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"], // Parent imports
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"], // Relative imports
            ["^.+\\.?(css|scss)$"], // Styles
          ],
        },
      ],
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.test.ts", "**/*.spec.ts"], // Test files
    rules: {
      "@typescript-eslint/no-unused-expressions": "off", // Disable the rule for test files
    },
  },
];
