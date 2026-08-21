import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke suite only — runs against a production build (`next start`) so
 * Next.js dev-mode on-demand compilation (measured at 2-16s per route this
 * session) doesn't make the suite slow/flaky. NEXT_PUBLIC_* env vars are
 * baked in at build time, so `webServer.command` builds fresh rather than
 * reusing any other job's build artifact — see the `e2e-smoke` job in
 * .github/workflows/web.yml for how those vars get populated from a local
 * `supabase start` stack. Config lives at the package root (not inside
 * e2e/) so `playwright test` finds it automatically from `npm run test:e2e`.
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: 'list',
    globalSetup: './e2e/fixtures/seed.ts',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        command: 'npm run build && npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },
});
