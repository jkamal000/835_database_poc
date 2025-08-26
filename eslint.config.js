const { defineConfig, globalIgnores } = require("eslint/config");

const globals = require("globals");

const { fixupConfigRules, fixupPluginRules } = require("@eslint/compat");

const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const _import = require("eslint-plugin-import");
const js = require("@eslint/js");

const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    files: ["**/*.ts"],

    languageOptions: {
      globals: {
        ...globals.node,
      },

      parser: tsParser,
      sourceType: "module",

      parserOptions: {
        project: ["tsconfig.json", "tsconfig.dev.json"],
        tsconfigRootDir: __dirname,
      },
    },

    extends: fixupConfigRules(
      compat.extends(
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended"
      )
    ),

    plugins: {
      "@typescript-eslint": fixupPluginRules(typescriptEslint),
      import: fixupPluginRules(_import),
    },

    rules: {
      quotes: "off",
      "import/no-unresolved": 0,
      "@typescript-eslint/no-unused-expressions": "off", // turn off the TS version
      "no-unused-expressions": "off", // turn off the base rule
    },
  },
  globalIgnores([
    "lib/**/*",
    "coverage/**/*",
    "src/shared/interface/R4.ts",
    "**/node_modules/",
  ]),
]);
