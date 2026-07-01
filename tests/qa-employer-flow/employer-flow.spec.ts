import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { attachDiagnostics, BREAKPOINTS, type PageDiagnostics } from "./helpers";

const SHOTS = resolve(__dirname, "screenshots");
const CREDS = resolve(__dirname, ".auth", "employer-creds.json");

interface DiagRecord {
  area: string;
  breakpoint: string;
  url: string;
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
}
const collected: DiagRecord[] = [];

function shotPath(bp: string, area: string): string {
  const dir = resolve(SHOTS, bp);
  mkdirSync(dir, { recursive: true });
  return resolve(dir, `${area}.png`);
}

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  // NB: socket.io keeps the network perpetually busy, so "networkidle" never
  // fires — we give client-fetched lists / images a fixed beat to paint instead.
  await page.waitForTimeout(1400);
}

async function snap(
  page: Page,
  diag: PageDiagnostics,
  area: string,
  bp: string,
): Promise<void> {
  await page.screenshot({ path: shotPath(bp, area), fullPage: true }).catch(() => {});
  collected.push({
    area,
    breakpoint: bp,
    url: page.url(),
    consoleErrors: [...diag.consoleErrors],
    pageErrors: [...diag.pageErrors],
    failedRequests: [...diag.failedRequests],
  });
}

test.afterAll(() => {
  mkdirSync(SHOTS, { recursive: true });
  writeFileSync(resolve(SHOTS, "diagnostics.json"), JSON.stringify(collected, null, 2));
  const dirty = collected.filter(
    (d) => d.consoleErrors.length || d.pageErrors.length || d.failedRequests.length,
  );
  // eslint-disable-next-line no-console
  console.log(`\n[diagnostics] ${collected.length} states captured, ${dirty.length} with errors`);
  for (const d of dirty) {
    // eslint-disable-next-line no-console
    console.log(`  ✗ ${d.breakpoint}/${d.area} (${d.url})`);
    for (const e of d.consoleErrors) console.log(`      console: ${e}`);
    for (const e of d.pageErrors) console.log(`      pageerror: ${e}`);
    for (const e of d.failedRequests) console.log(`      net: ${e}`);
  }
});

/* ------------------------------------------------------------------ *
 * PUBLIC PAGES (no session): landing, registration, login
 * ------------------------------------------------------------------ */
test.describe("public", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const publicAreas = [
    { area: "01-landing", path: "/" },
    { area: "02-register-step1", path: "/register" },
    { area: "03-login", path: "/login" },
  ];

  for (const bp of BREAKPOINTS) {
    for (const { area, path } of publicAreas) {
      test(`[${bp.name}] ${area}`, async ({ page }) => {
        const diag = attachDiagnostics(page);
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await page.goto(path);
        await settle(page);
        await snap(page, diag, area, bp.name);
      });
    }
  }

  test("[desktop] 03b-login-invalid-validation", async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/login");
    await settle(page);
    // submit empty / bad creds and capture validation
    await page.locator("#identifier").fill("not-an-email");
    await page.locator("#password").fill("x");
    await page.getByRole("button", { name: /^Sign in$/i }).first().click().catch(() => {});
    await page.waitForTimeout(1200);
    await snap(page, diag, "03b-login-invalid", "desktop");
  });

  test("[desktop] 02b-register-role-and-details", async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/register");
    await settle(page);
    await page.locator('input[autocomplete="given-name"]').fill("Amara");
    await page.locator('input[autocomplete="family-name"]').fill("Njoroge");
    await page.locator('input[type="email"]').fill(`walkthrough+${Date.now()}@tesilix.test`);
    await page.locator('input[type="tel"]').fill("+254700000000");
    await page.locator('input[autocomplete="new-password"]').first().fill("Tesilix!QA2026");
    await page.locator('input[autocomplete="new-password"]').nth(1).fill("Tesilix!QA2026");
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(600);
    await snap(page, diag, "02b-register-step2-role", "desktop");
    await page.getByRole("button", { name: /I need a fundi/i }).click();
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(600);
    await snap(page, diag, "02c-register-step3-employer", "desktop");
  });

  test("[desktop] 02d-register-empty-validation", async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/register");
    await settle(page);
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(800);
    await snap(page, diag, "02d-register-validation", "desktop");
  });
});

/* ------------------------------------------------------------------ *
 * AUTHED EMPLOYER SWEEP — every sidebar route at 3 breakpoints
 * ------------------------------------------------------------------ */
const AUTHED_AREAS = [
  { area: "04-dashboard", path: "/employer/dashboard" },
  { area: "05-search", path: "/employer/search" },
  { area: "08-jobs", path: "/employer/jobs" },
  { area: "10-messages", path: "/employer/messages" },
  { area: "11-hires", path: "/employer/hires" },
  { area: "12-reviews", path: "/employer/reviews" },
  { area: "13-settings", path: "/employer/settings" },
  { area: "14-profile", path: "/employer/profile" },
];

test.describe("employer sweep", () => {
  for (const bp of BREAKPOINTS) {
    for (const { area, path } of AUTHED_AREAS) {
      test(`[${bp.name}] ${area}`, async ({ page }) => {
        const diag = attachDiagnostics(page);
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await page.goto(path);
        await settle(page);
        await snap(page, diag, area, bp.name);
      });
    }
  }
});

/* ------------------------------------------------------------------ *
 * AUTHED INTERACTIONS (desktop unless noted)
 * ------------------------------------------------------------------ */
test.describe("employer interactions", () => {
  test("06-search: query, filters, sort, no-results, worker profile", async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/employer/search");
    await settle(page);

    // type a query + search
    const q = page.locator('input[placeholder*="Search by name"]');
    await q.fill("plumber");
    await page.getByRole("button", { name: /^Search$/ }).first().click().catch(() => {});
    await page.waitForTimeout(1500);
    await snap(page, diag, "06a-search-results", "desktop");

    // apply a trade filter pill (Electrical) + sort if present
    await page.getByRole("button", { name: /Electrical|Electrician/i }).first().click().catch(() => {});
    await page.waitForTimeout(1200);
    await snap(page, diag, "06b-search-filtered", "desktop");

    // no-results state
    await q.fill("zzqwx-no-such-worker-9999");
    await page.getByRole("button", { name: /^Search$/ }).first().click().catch(() => {});
    await page.waitForTimeout(1500);
    await snap(page, diag, "06c-search-no-results", "desktop");

    // recover, open first worker profile
    await q.fill("");
    await page.getByRole("button", { name: /^Search$/ }).first().click().catch(() => {});
    await page.waitForTimeout(1500);
    const firstCard = page.getByRole("button", { name: /view profile|view/i }).first();
    if (await firstCard.isVisible().catch(() => false)) {
      await firstCard.click().catch(() => {});
    } else {
      // fallback: click first worker link
      await page.locator('a[href^="/worker/"]').first().click().catch(() => {});
    }
    await page.waitForURL(/\/worker\//, { timeout: 15000 }).catch(() => {});
    await settle(page);
    await snap(page, diag, "07-worker-profile", "desktop");
  });

  test("07m-worker-profile mobile", async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/employer/search");
    await settle(page);
    await page.getByRole("button", { name: /^Profile$/ }).first().click().catch(() => {});
    await page.waitForURL(/\/worker\//, { timeout: 15000 }).catch(() => {});
    await settle(page);
    await snap(page, diag, "07-worker-profile", "mobile");
  });

  test("09-message a worker / start conversation", async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/employer/search");
    await settle(page);
    await page.getByRole("button", { name: /^Profile$/ }).first().click().catch(() => {});
    await page.waitForURL(/\/worker\//, { timeout: 15000 }).catch(() => {});
    await settle(page);
    const msgBtn = page.getByRole("button", { name: /message/i }).first();
    const msgLink = page.getByRole("link", { name: /message/i }).first();
    if (await msgBtn.isVisible().catch(() => false)) await msgBtn.click().catch(() => {});
    else if (await msgLink.isVisible().catch(() => false)) await msgLink.click().catch(() => {});
    await page.waitForTimeout(2000);
    await snap(page, diag, "09-message-worker", "desktop");
  });

  test("13v-settings form validation", async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/employer/settings");
    await settle(page);
    // clear a required field and attempt save to surface validation
    const firstInput = page.locator('input[type="text"], input:not([type])').first();
    if (await firstInput.isVisible().catch(() => false)) {
      await firstInput.fill("").catch(() => {});
    }
    await page.getByRole("button", { name: /save/i }).first().click().catch(() => {});
    await page.waitForTimeout(1200);
    await snap(page, diag, "13b-settings-validation", "desktop");
  });

  test("15-notifications bell dropdown", async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/employer/dashboard");
    await settle(page);
    const bell = page
      .getByRole("button", { name: /notification/i })
      .or(page.locator('[aria-label*="otification"]'))
      .first();
    await bell.click().catch(() => {});
    await page.waitForTimeout(1000);
    await snap(page, diag, "15-notifications", "desktop");
  });

  test("16-account menu + logout", async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/employer/dashboard");
    await settle(page);
    // open account menu — the top-right control that shows the user's name.
    // (Avoid [aria-haspopup] here: it also matches the Next.js dev-tools button.)
    const menu = page.getByRole("button", { name: /Njoroge|Amara/i }).first();
    await menu.click().catch(() => {});
    await page.waitForTimeout(700);
    await snap(page, diag, "16a-account-menu", "desktop");
    const logout = page.getByRole("button", { name: /log ?out|sign ?out/i }).first();
    const logoutLink = page.getByRole("link", { name: /log ?out|sign ?out/i }).first();
    if (await logout.isVisible().catch(() => false)) await logout.click().catch(() => {});
    else if (await logoutLink.isVisible().catch(() => false)) await logoutLink.click().catch(() => {});
    await page.waitForTimeout(2500);
    await snap(page, diag, "16b-after-logout", "desktop");
  });

  test("17-sidebar nav cold-clicks", async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/employer/dashboard");
    await settle(page);
    const navLabels = [
      "Find a fundi",
      "My jobs",
      "Messages",
      "Past hires",
      "My reviews",
      "Settings",
      "Dashboard",
    ];
    const results: { label: string; ok: boolean; url: string }[] = [];
    for (const label of navLabels) {
      const link = page.getByRole("link", { name: new RegExp(`^${label}$`, "i") }).first();
      const before = page.url();
      let ok = false;
      if (await link.isVisible().catch(() => false)) {
        await link.click().catch(() => {});
        await page.waitForTimeout(1200);
        ok = page.url() !== before || label === "Dashboard";
      }
      results.push({ label, ok, url: page.url() });
    }
    writeFileSync(resolve(SHOTS, "nav-clicks.json"), JSON.stringify(results, null, 2));
    await snap(page, diag, "17-sidebar-last", "desktop");
  });
});
