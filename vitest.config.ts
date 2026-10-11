import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts", "**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.turbo/**"],
  },
  resolve: {
    alias: {
      "@central-pc/schemas": path.resolve(__dirname, "./packages/schemas/index.ts"),
    },
  },
});
