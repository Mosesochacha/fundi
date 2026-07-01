import { defineConfig, devices } from "@playwright/test";

/**
 * QA regression suite for the Tesilix employer flow.
 *
 * Drives the real local dev stack (Next.js on :3000, Express on :9000) through
 * a system-installed Google Chrome — no bundled browser download required.
 * Screenshots for the audit land in ./screenshots/<breakpoint>/.
 */
export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  outputDir: "./test-results",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "employer",
      testMatch: /employer-flow\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        storageState: "./.auth/employer.json",
      },
    },
    {
      // Two-actor hire→accept→complete→review lifecycle. Creates its own worker
      // and manages both contexts itself, so no project-level storageState.
      name: "lifecycle",
      testMatch: /hire-lifecycle\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});
