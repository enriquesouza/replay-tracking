// Flat-config ESLint for v2 (ESLint 9+).
const globals = require("globals");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "artifacts/**",
      "cache/**",
      "out/**",
      "broadcast/**",
      "typechain-types/**",
      "coverage/**",
      ".venv/**",
      "scripts/**",
      "tests/reports/**",
      "**/*.md",
    ],
  },
  // CommonJS — index.js, server/, tests/hardhat/, etc.
  {
    files: ["**/*.{js,cjs}"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "commonjs",
      globals: { ...globals.node, ...globals.mocha },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-implicit-globals": "error",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      "no-throw-literal": "error",
      "no-return-await": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  // ESM — vite.config.js, .mjs files
  {
    files: ["vite.config.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: { ...globals.node, ...globals.mocha },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-implicit-globals": "error",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      "no-throw-literal": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  // Vitest tests (ESM)
  {
    files: ["tests/**/*.test.js", "tests/endpoints.test.js"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: { ...globals.node, ...globals.mocha, ...globals.vitest },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-console": "off", // tests can console.log
    },
  },
];
