import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Vitest handles the Fastify server endpoint tests.
    // Hardhat's mocha test runner handles `tests/hardhat/*.test.js` separately.
    include: ["tests/**/*.test.js"],
    exclude: ["tests/hardhat/**", "node_modules/**", ".venv/**", "dist/**"],
    coverage: {
      reporter: ["text", "lcov"],
      include: ["server/**/*.js", "index.js"],
      exclude: ["server/routes/contract.js.bak", "**/*.test.js"],
    },
  },
});
