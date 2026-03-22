import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsxInject: 'import React from "react"',
  },
  resolve: {
    alias: {
      tslib: fileURLToPath(new URL("./src/vendor/tslib.js", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
