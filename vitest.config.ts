import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/web/**/*.test.ts"],
  },
});
