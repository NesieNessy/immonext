import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    // The detail-check calculation modules are pure TypeScript with no DOM and
    // no React, so the node environment is enough — no jsdom, no testing
    // library, no React plugin. Keep it that way: these tests exist to pin
    // down financial and legal rules, not to render components.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    // Mirrors the `@/*` path mapping from tsconfig.json so tests can import the
    // same way application code does.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
