import { defineConfig } from "vitest/config";

/**
 * Tests cover the pure logic only — statutory thresholds, money arithmetic, date
 * conversion, and the overlay guard. Those encode legal facts and financial amounts,
 * which are what must not drift silently when someone edits a constant. Rendering is
 * verified in the browser instead.
 */
export default defineConfig({
  // Native tsconfig path resolution, so the @/ alias works without a plugin.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
