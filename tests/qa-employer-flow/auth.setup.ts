import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test as setup } from "@playwright/test";
import { readOtpFromRedis } from "./helpers";

const AUTH_DIR = resolve(__dirname, ".auth");
const STORAGE = resolve(AUTH_DIR, "employer.json");
const CREDS = resolve(AUTH_DIR, "employer-creds.json");

/**
 * Create a brand-new employer through the REAL signup UI, verify the email via
 * the OTP the backend put in Redis, and persist the resulting NextAuth session.
 *
 * This is step 1 & 2 & 3 of the audit scope (landing/signup/onboarding + login)
 * exercised for real — no DB inserts.
 */
setup("register + verify a fresh employer via the UI", async ({ page }) => {
  mkdirSync(AUTH_DIR, { recursive: true });

  // Deterministic-per-run unique identity.
  const stamp = Date.now();
  const email = `qa.employer+${stamp}@tesilix.test`;
  const password = "Tesilix!QA2026";
  const firstName = "Amara";
  const lastName = "Njoroge";
  const phone = `+2547${String(stamp).slice(-8)}`;
  const location = "Nairobi, Kenya";

  // --- Landing → Sign up ---
  await page.goto("/");
  await expect(page).toHaveTitle(/Tesilix|Hire|Fundi/i);
  await page.goto("/register");

  // --- Step 1: account basics ---
  await expect(page.getByText(/Create your/i)).toBeVisible();
  // NB: field labels are <span>, not <label> — no accessible name association,
  // so we target by stable autocomplete/type attributes (also an A11y finding).
  await page.locator('input[autocomplete="given-name"]').fill(firstName);
  await page.locator('input[autocomplete="family-name"]').fill(lastName);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="tel"]').fill(phone);
  await page.locator('input[autocomplete="new-password"]').first().fill(password);
  await page.locator('input[autocomplete="new-password"]').nth(1).fill(password);
  await page.getByRole("button", { name: "Next →", exact: true }).click();

  // --- Step 2: choose employer role ---
  await expect(page.getByText(/How will you use Tesilix/i)).toBeVisible();
  await page.getByRole("button", { name: /I need a fundi/i }).click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();

  // --- Step 3: location + trades + terms ---
  await expect(page.getByText(/Where are/i)).toBeVisible();
  await page.locator('input[placeholder*="city"]').fill(location);
  await page.getByRole("button", { name: /^Plumbing$/ }).click();
  await page.getByRole("button", { name: /^Electrical$/ }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Create account/i }).click();

  // --- Step 4: success → go verify ---
  await expect(page.getByText(/You’re on|You're on/i)).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Verify your email/i }).click();

  // --- Verify email via OTP from Redis ---
  await expect(page).toHaveURL(/verify-email/);
  const code = await readOtpFromRedis(email);
  const boxes = page.locator('input[inputmode="numeric"]');
  await expect(boxes.first()).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await boxes.nth(i).fill(code[i]);
  }
  // Some UIs auto-submit on last digit; otherwise click verify.
  const verifyBtn = page.getByRole("button", { name: /verify/i });
  if (await verifyBtn.isVisible().catch(() => false)) {
    await verifyBtn.click().catch(() => {});
  }

  // --- Land on employer dashboard, session established ---
  await page.waitForURL(/\/employer\/dashboard/, { timeout: 30_000 });
  await expect(page).toHaveURL(/\/employer\/dashboard/);

  await page.context().storageState({ path: STORAGE });
  writeFileSync(
    CREDS,
    JSON.stringify({ email, password, firstName, lastName, phone, location }, null, 2),
  );
  // eslint-disable-next-line no-console
  console.log(`\n[auth.setup] employer ready: ${email}\n`);
});
