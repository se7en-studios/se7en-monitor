import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    // Las pruebas de reglas comparten un solo emulador: una por vez.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
