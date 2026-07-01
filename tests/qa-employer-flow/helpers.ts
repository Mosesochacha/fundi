import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, type ConsoleMessage, type Page, type Request } from "@playwright/test";

export const BREAKPOINTS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 812 },
] as const;

export type BreakpointName = (typeof BREAKPOINTS)[number]["name"];

/** Read REDIS_URL out of backend/.env so we can pull OTP codes out-of-band. */
function backendRedisUrl(): string {
  const envPath = resolve(__dirname, "../../backend/.env");
  const raw = readFileSync(envPath, "utf8");
  const line = raw.split("\n").find((l) => l.startsWith("REDIS_URL="));
  if (!line) throw new Error("REDIS_URL not found in backend/.env");
  return line.replace(/^REDIS_URL=/, "").replace(/^"|"$/g, "").trim();
}

/**
 * Fetch the OTP the backend stashed in Redis for a freshly-registered email.
 * This is the ONLY out-of-band shortcut — the signup + verify UI itself is
 * still driven for real. We never touch the DB.
 */
export async function readOtpFromRedis(
  email: string,
  purpose: "verification" | "reset" | "login" = "verification",
): Promise<string> {
  // ioredis lives in the backend workspace; import it from there.
  const { default: Redis } = await import(
    resolve(__dirname, "../../backend/node_modules/ioredis/built/index.js")
  );
  const redis = new Redis(backendRedisUrl(), { maxRetriesPerRequest: 3 });
  try {
    for (let attempt = 0; attempt < 20; attempt++) {
      const raw = await redis.get(`otp:${purpose}:${email.toLowerCase()}`);
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.code) return String(data.code);
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`OTP never appeared in Redis for ${email}`);
  } finally {
    await redis.quit();
  }
}

/**
 * Attach console + network-failure listeners to a page and return a live
 * collector. Call before navigating. `errors` accumulates console errors and
 * failed / 4xx-5xx requests seen since attach.
 */
export interface PageDiagnostics {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  reset(): void;
}

// Noise we don't want to flag: expected auth pre-checks, analytics, HMR.
const IGNORED_REQUEST_PATTERNS = [
  /\/auth\/pending-verification/, // 401 by design when not mid-verify
  /posthog/i,
  /_next\/static/,
  /\.hot-update\./,
  /favicon/i,
];

const IGNORED_CONSOLE_PATTERNS = [
  /Download the React DevTools/i,
  /\[HMR\]/i,
  /Fast Refresh/i,
  /posthog/i,
];

export interface Account {
  role: "employer" | "worker";
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  trade?: string;
}

/**
 * Register a fresh account through the REAL signup UI and verify the email via
 * the OTP in Redis. Works for either role. Leaves the page on the role's
 * dashboard with an active NextAuth session. Returns the credentials used.
 */
export async function registerViaUI(
  page: Page,
  role: "employer" | "worker",
  stamp: number,
): Promise<Account> {
  const email = `qa.${role}+${stamp}@tesilix.test`;
  const password = "Tesilix!QA2026";
  const firstName = role === "worker" ? "Kwame" : "Amara";
  const lastName = role === "worker" ? `Otieno${String(stamp).slice(-5)}` : "Njoroge";
  const phone = `+2547${String(stamp).slice(-8)}`;
  const location = "Nairobi, Kenya";
  const trade = "Plumber";

  await page.goto("/register");
  await expect(page.getByText(/Create your/i)).toBeVisible();
  await page.locator('input[autocomplete="given-name"]').fill(firstName);
  await page.locator('input[autocomplete="family-name"]').fill(lastName);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="tel"]').fill(phone);
  await page.locator('input[autocomplete="new-password"]').first().fill(password);
  await page.locator('input[autocomplete="new-password"]').nth(1).fill(password);
  await page.getByRole("button", { name: "Next →", exact: true }).click();

  // Role step
  await expect(page.getByText(/How will you use Tesilix/i)).toBeVisible();
  await page
    .getByRole("button", { name: role === "worker" ? /I am a fundi/i : /I need a fundi/i })
    .click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();

  // Details step
  await page.locator('input[placeholder*="city"]').fill(location);
  if (role === "worker") {
    await page.getByRole("button", { name: new RegExp(`^${trade}$`) }).click();
  } else {
    await page.getByRole("button", { name: /^Plumbing$/ }).click();
  }
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: role === "worker" ? /Create my profile/i : /Create account/i })
    .click();

  // Success → verify
  await expect(page.getByText(/You’re on|You're on/i)).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Verify your email/i }).click();
  await expect(page).toHaveURL(/verify-email/);
  const code = await readOtpFromRedis(email);
  const boxes = page.locator('input[inputmode="numeric"]');
  await expect(boxes.first()).toBeVisible();
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill(code[i]);
  const verifyBtn = page.getByRole("button", { name: /verify/i });
  if (await verifyBtn.isVisible().catch(() => false)) await verifyBtn.click().catch(() => {});
  await page.waitForURL(new RegExp(`/${role}/dashboard`), { timeout: 30_000 });

  return { role, email, password, firstName, lastName, phone, location, trade };
}

export function attachDiagnostics(page: Page): PageDiagnostics {
  const diag: PageDiagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    reset() {
      this.consoleErrors = [];
      this.pageErrors = [];
      this.failedRequests = [];
    },
  };

  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORED_CONSOLE_PATTERNS.some((p) => p.test(text))) return;
    diag.consoleErrors.push(text);
  });

  page.on("pageerror", (err) => {
    diag.pageErrors.push(err.message);
  });

  page.on("requestfailed", (req: Request) => {
    const url = req.url();
    if (IGNORED_REQUEST_PATTERNS.some((p) => p.test(url))) return;
    diag.failedRequests.push(`FAILED ${req.method()} ${url} — ${req.failure()?.errorText}`);
  });

  page.on("response", (res) => {
    const url = res.url();
    const status = res.status();
    if (status < 400) return;
    if (IGNORED_REQUEST_PATTERNS.some((p) => p.test(url))) return;
    diag.failedRequests.push(`HTTP ${status} ${res.request().method()} ${url}`);
  });

  return diag;
}
