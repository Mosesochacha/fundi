import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { type BrowserContext, expect, type Page, test } from "@playwright/test";
import { type Account, registerViaUI } from "./helpers";

/**
 * Full two-actor hire lifecycle, driven entirely through the UI:
 *
 *   employer  POST /jobs (Request hire)      → status pending
 *   worker    Accept job                      → status accepted/active
 *   employer  Mark complete                   → status completed
 *   employer  Leave review (rating + text)    → review recorded
 *
 * Populated dashboard / My jobs / Past hires / My reviews are screenshotted
 * along the way — the states the empty-state audit couldn't reach.
 */

const SHOTS = resolve(__dirname, "screenshots", "lifecycle");
const EMPLOYER_STATE = resolve(__dirname, ".auth", "employer.json");

function shot(page: Page, name: string) {
  mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: resolve(SHOTS, `${name}.png`), fullPage: true });
}

/** Deep-scan an API JSON payload for the first plausible profile username. */
function findUsername(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (k === "username" && typeof v === "string" && /^[a-z0-9]{3,20}$/.test(v)) return v;
    if (typeof v === "object") {
      const nested = findUsername(v);
      if (nested) return nested;
    }
  }
  return null;
}

test("hire lifecycle: request → accept → complete → review", async ({ browser }) => {
  // Long, two-actor E2E driven through the real dev stack; Turbopack cold
  // compiles under load make first-hit navigations slow, so budget generously.
  test.setTimeout(360_000);
  const stamp = Date.now();

  // ---- Worker actor: create via real signup, capture their username ----
  const workerCtx: BrowserContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const wPage = await workerCtx.newPage();
  wPage.setDefaultNavigationTimeout(60_000);
  let workerUsername: string | null = null;
  wPage.on("response", async (res) => {
    if (workerUsername) return;
    const url = res.url();
    if (!/\/api\/v1\/(auth|worker|profile)/.test(url)) return;
    if (!(res.headers()["content-type"] || "").includes("json")) return;
    try {
      workerUsername = findUsername(await res.json());
    } catch {
      /* body not JSON / already consumed */
    }
  });
  const worker: Account = await registerViaUI(wPage, "worker", stamp);
  // give the profile/me calls a beat to land so the username listener fires
  await wPage.waitForTimeout(1500);
  const constructed = `${worker.firstName}${worker.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, "");
  const username = workerUsername || constructed;
  // eslint-disable-next-line no-console
  console.log(`[lifecycle] worker=${worker.email} username=${username}`);

  // ---- Employer actor: reuse the session created by auth.setup ----
  const employerCtx: BrowserContext = await browser.newContext({
    storageState: EMPLOYER_STATE,
    viewport: { width: 1280, height: 900 },
  });
  const ePage = await employerCtx.newPage();
  ePage.setDefaultNavigationTimeout(60_000);

  // 1) Employer opens the worker's profile and sends a hire request.
  // IMPORTANT: the profile renders public (logged-out) chrome until useAuth
  // hydrates; clicking Request hire before then bounces through /login. Wait
  // for the employer Shell (sidebar) to confirm the signed-in view is live.
  await ePage.goto(`/worker/${username}`, { waitUntil: "domcontentloaded" });
  await ePage.getByRole("link", { name: "My jobs" }).waitFor({ state: "visible", timeout: 25_000 });
  await ePage.waitForTimeout(1500); // let the profile query (data) resolve so onHire fires

  const dialog = ePage.getByRole("dialog", { name: /hire/i });
  for (let attempt = 0; attempt < 5; attempt++) {
    await ePage.getByRole("button", { name: /request hire/i }).first().click().catch(() => {});
    if (await dialog.isVisible().catch(() => false)) break;
    await ePage.waitForTimeout(1500);
  }
  await expect(dialog).toBeVisible();
  // job type + location are prefilled; fill the rest to make a realistic request
  await ePage.locator("#hire-jobtype").fill("Kitchen sink repair");
  await ePage.locator("#hire-location").fill("Kilimani, Nairobi");
  await ePage.locator("#hire-desc").fill("Leaking kitchen sink and slow drain — needs a proper fix.");
  await ePage.locator("#hire-budget").fill("3500");
  await shot(ePage, "01-hire-modal");
  await ePage.getByRole("button", { name: /send request/i }).click();
  await expect(ePage.getByText(/request sent/i)).toBeVisible({ timeout: 15_000 });

  // 2) Employer dashboard now shows a pending response
  await ePage.goto("/employer/dashboard", { waitUntil: "domcontentloaded" });
  await ePage.waitForTimeout(5000);
  await shot(ePage, "02-dashboard-pending");

  // My jobs → Pending
  await ePage.goto("/employer/jobs", { waitUntil: "domcontentloaded" });
  await ePage.waitForTimeout(4000);
  await shot(ePage, "03-myjobs-pending");

  // 3) Worker accepts the request
  await wPage.goto("/worker/requests", { waitUntil: "domcontentloaded" });
  await wPage.waitForTimeout(4000);
  await shot(wPage, "04-worker-requests-new");
  await wPage.getByRole("button", { name: /accept job/i }).first().click();
  await wPage.waitForTimeout(2500);
  await shot(wPage, "05-worker-requests-accepted");

  // 4) Employer dashboard + My jobs now show an active job
  await ePage.goto("/employer/dashboard", { waitUntil: "domcontentloaded" });
  await ePage.waitForTimeout(5000);
  await shot(ePage, "06-dashboard-active");
  await ePage.goto("/employer/jobs", { waitUntil: "domcontentloaded" });
  await ePage.waitForTimeout(4000);
  await shot(ePage, "07-myjobs-active");

  // 5) Employer marks the job complete
  await ePage.getByRole("button", { name: /mark complete/i }).first().click();
  await ePage.getByRole("button", { name: /yes, complete/i }).first().click();
  await expect(ePage.getByText(/marked as complete/i)).toBeVisible({ timeout: 15_000 });
  await ePage.waitForTimeout(2500);
  await shot(ePage, "08-myjobs-completed");

  // 6) Past hires is now populated
  await ePage.goto("/employer/hires", { waitUntil: "domcontentloaded" });
  await ePage.waitForTimeout(5000);
  await shot(ePage, "09-hires-populated");

  // 7) Employer leaves a review (5 stars + text)
  await ePage.goto("/employer/jobs", { waitUntil: "domcontentloaded" });
  await ePage.waitForTimeout(4000);
  await ePage.getByRole("button", { name: /leave review/i }).first().click();
  const reviewDialog = ePage.getByRole("dialog", { name: /review/i });
  await expect(reviewDialog).toBeVisible();
  await ePage.getByRole("button", { name: "5 stars" }).click();
  await ePage.locator("#review-text").fill("Fast, tidy and fairly priced. Sorted the leak in one visit.");
  await shot(ePage, "10-review-modal");
  await ePage.getByRole("button", { name: /submit review/i }).click();
  await expect(ePage.getByText(/review submitted/i)).toBeVisible({ timeout: 15_000 });

  // 8) My reviews is now populated
  await ePage.goto("/employer/reviews", { waitUntil: "domcontentloaded" });
  await ePage.waitForTimeout(5000);
  await shot(ePage, "11-reviews-populated");

  await workerCtx.close();
  await employerCtx.close();
});
