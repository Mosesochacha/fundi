import { defineConfig, devices } from "@playwright/test";

/**
 * QA audit suite for the Tesilix landing page (/).
 *
 * Loads the REAL rendered page against the local dev server (Next.js on :3000)
 * through system Chrome, clicks every nav link / CTA / footer link, captures
 * console errors, and measures contrast + section spacing programmatically.
 *
 * Screenshots land in ./screenshots/<breakpoint>/. Run against a logged-OUT
 * context — the landing page redirects authenticated users to their dashboard.
 */
const BREAKPOINTS = {
  desktop: { width: 1280, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
} as const;

export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["json", { outputFile: "results.json" }]],
  outputDir: "./test-results",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
    // No storageState => anonymous visitor, the real landing-page audience.
  },
  projects: [
    {
      name: "desktop",
      testMatch: /landing\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: BREAKPOINTS.desktop },
    },
    {
      name: "tablet",
      testMatch: /landing\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: BREAKPOINTS.tablet },
    },
    {
      name: "mobile",
      testMatch: /landing\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: BREAKPOINTS.mobile },
    },
  ],
});
