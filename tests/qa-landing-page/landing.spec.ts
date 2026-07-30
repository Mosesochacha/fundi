import { expect, type Page, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Tesilix landing-page audit. One spec, run at three viewports by the config's
 * desktop/tablet/mobile projects. Screenshots -> ./screenshots/<project>/.
 */

const bp = () => test.info().project.name; // "desktop" | "tablet" | "mobile"
const shotDir = () => path.join(__dirname, "screenshots", bp());

function shot(name: string) {
  return path.join(shotDir(), `${name}.png`);
}

// Freeze reveal/marquee animations so screenshots are deterministic and no
// section renders blank (reveal starts at opacity:0 until scrolled into view).
const FREEZE_CSS = `
  *, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }
  .reveal { opacity: 1 !important; transform: none !important; }
  .animate-marquee, .animate-marquee-reverse { animation: none !important; }
  /* Scroll-reveal targets (LandingMotion): force the settled state so a section
     never screenshots blank just because the observer has not fired yet. */
  [data-rise], [data-draw], [data-grow] { opacity: 1 !important; transform: none !important; }
`;

async function gotoLanding(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.addStyleTag({ content: FREEZE_CSS });
  return errors;
}

// WCAG relative-luminance contrast ratio between two "rgb(...)" strings,
// flattened onto an opaque backdrop when the foreground carries alpha.
function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const enc = (c: number) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(v * 255)));
  };
  return [enc(lin[0]), enc(lin[1]), enc(lin[2])];
}

// Handles both rgb()/rgba() and Tailwind v4 oklab()/color-mix opacity outputs.
function parseRgb(s: string): [number, number, number, number] {
  const ok = s.match(/oklab\(([^)]+)\)/);
  if (ok) {
    const parts = ok[1].split("/");
    const [L, a, b] = parts[0].trim().split(/\s+/).map(parseFloat);
    const alpha = parts[1] ? parseFloat(parts[1]) : 1;
    const [r, g, bl] = oklabToRgb(L, a, b);
    return [r, g, bl, alpha];
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return [0, 0, 0, 1];
  const p = m[1].split(",").map((x) => parseFloat(x.trim()));
  return [p[0], p[1], p[2], p[3] ?? 1];
}
function flatten(fg: number[], bg: number[]) {
  const a = fg[3];
  return [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a)));
}
function lum([r, g, b]: number[]) {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(fgStr: string, bgStr: string) {
  const fg = parseRgb(fgStr);
  const bg = parseRgb(bgStr);
  const flat = flatten(fg, bg);
  const L1 = lum(flat) + 0.05;
  const L2 = lum([bg[0], bg[1], bg[2]]) + 0.05;
  const ratio = Math.max(L1, L2) / Math.min(L1, L2);
  return Math.round(ratio * 100) / 100;
}

const AUDIT: Record<string, unknown> = {};
function record(key: string, value: unknown) {
  AUDIT[`${bp()}:${key}`] = value;
}

test.afterAll(async () => {
  const out = path.join(__dirname, "test-results", `audit-${bp()}.json`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  // Merge into any existing file so a partial (--grep) re-run doesn't clobber
  // measurements from other tests in the suite.
  let prev: Record<string, unknown> = {};
  try {
    prev = JSON.parse(fs.readFileSync(out, "utf8"));
  } catch {}
  fs.writeFileSync(out, JSON.stringify({ ...prev, ...AUDIT }, null, 2));
});

// ---------------------------------------------------------------------------
// 1. Screenshots: full page + every section scrolled into view
// ---------------------------------------------------------------------------
test("screenshots: full page and each section", async ({ page }) => {
  fs.mkdirSync(shotDir(), { recursive: true });
  await gotoLanding(page);

  // Full page
  await page.screenshot({ path: shot("00-full-page"), fullPage: true });

  // Navbar (top of viewport)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: shot("01-navbar"), clip: { x: 0, y: 0, width: page.viewportSize()!.width, height: 72 } });

  const sections: { name: string; sel: string }[] = [
    { name: "02-hero", sel: "section:has(h1)" },
    { name: "03-marquee", sel: ".marquee-wrapper" },
    { name: "04-how", sel: "#how" },
    { name: "05-why", sel: "#why" },
    { name: "06-global", sel: "#global" },
    { name: "07-founding", sel: "section:has-text('Founding members')" },
    { name: "08-trust", sel: "#trust" },
    { name: "09-cta", sel: "section:has-text('next great fundi')" },
    { name: "10-footer", sel: "footer" },
  ];
  for (const s of sections) {
    const el = page.locator(s.sel).first();
    if ((await el.count()) === 0) {
      record(`missing-section:${s.name}`, s.sel);
      continue;
    }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    await el.screenshot({ path: shot(s.name) }).catch(async () => {
      // Element taller than screenshot limits — fall back to viewport shot.
      await page.screenshot({ path: shot(`${s.name}-viewport`) });
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Console / page errors on load
// ---------------------------------------------------------------------------
test("no console or page errors on load", async ({ page }) => {
  const errors = await gotoLanding(page);
  await page.waitForTimeout(1500);
  record("consoleErrors", errors);
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
});

// ---------------------------------------------------------------------------
// 3. Navbar links (desktop shows inline links; mobile uses hamburger)
// ---------------------------------------------------------------------------
test("navbar links navigate/scroll correctly", async ({ page }) => {
  await gotoLanding(page);
  const isMobile = bp() === "mobile";

  const expected = [
    { label: "How it works", href: "/#how", anchor: "#how" },
    { label: "Browse workers", href: "/browse", anchor: null },
    { label: "Why Tesilix", href: "/#why", anchor: "#why" },
    { label: "Trust & safety", href: "/#trust", anchor: "#trust" },
    { label: "Global", href: "/#global", anchor: "#global" },
  ];

  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("button", { name: "Close menu" })).toBeVisible();
    await page.screenshot({ path: shot("01b-mobile-menu") });
  }

  const results: Record<string, string> = {};
  for (const link of expected) {
    if (isMobile && !(await page.getByRole("button", { name: "Close menu" }).isVisible())) {
      await page.getByRole("button", { name: "Open menu" }).click();
    }
    const loc = page.getByRole("link", { name: link.label, exact: true }).first();
    const href = await loc.getAttribute("href");
    results[link.label] = href ?? "MISSING";
    expect(href, `${link.label} href`).toBe(link.href);

    if (link.anchor) {
      await loc.click();
      await page.waitForTimeout(500);
      const target = page.locator(link.anchor);
      await expect(target, `${link.anchor} exists`).toHaveCount(1);
      const inView = await target.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      });
      results[`${link.label}:scrolledIntoView`] = String(inView);
    }
  }
  record("navLinks", results);

  // Browse workers actually navigates. Reload for a clean state (the anchor
  // clicks above left the URL on /#global), then wait for the real client-side
  // navigation to settle rather than racing domcontentloaded.
  await page.goto("/", { waitUntil: "networkidle" });
  if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("link", { name: "Browse workers", exact: true }).first().click();
  await page.waitForURL("**/browse", { timeout: 15_000 }).catch(() => {});
  record("browseWorkersLandsOn", new URL(page.url()).pathname);
  expect(new URL(page.url()).pathname).toBe("/browse");
});

// ---------------------------------------------------------------------------
// 4. Auth CTAs (Sign in / Sign up) + every primary CTA link target
// ---------------------------------------------------------------------------
test("auth buttons and hero/CTA targets", async ({ page }) => {
  await gotoLanding(page);
  const isMobile = bp() === "mobile";

  if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
  const signIn = page.getByRole("link", { name: "Sign in", exact: true }).first();
  const signUp = page.getByRole("link", { name: "Sign up", exact: true }).first();
  record("authButtons", {
    signIn: await signIn.getAttribute("href"),
    signUp: await signUp.getAttribute("href"),
  });
  expect(await signIn.getAttribute("href")).toBe("/login");
  expect(await signUp.getAttribute("href")).toBe("/register");
  if (isMobile) await page.getByRole("button", { name: "Close menu" }).click();

  // Collect every landing CTA link label -> href.
  const ctas = await page.evaluate(() => {
    const out: { text: string; href: string }[] = [];
    document.querySelectorAll("a").forEach((a) => {
      const t = (a.textContent || "").trim();
      if (
        /browse the work|join as a worker|create your profile|find someone now|browse verified workers|open the directory|add your city/i.test(
          t,
        )
      ) {
        out.push({ text: t, href: a.getAttribute("href") || "" });
      }
    });
    return out;
  });
  record("ctaTargets", ctas);
  for (const c of ctas) expect(c.href, `${c.text} has href`).toBeTruthy();
});

// ---------------------------------------------------------------------------
// 5. Footer links — flag dead <button> placeholders vs real links
// ---------------------------------------------------------------------------
test("footer links and dead placeholders", async ({ page }) => {
  await gotoLanding(page);
  await page.locator("footer").scrollIntoViewIfNeeded();

  const footerLinks = await page.locator("footer a").evaluateAll((els) =>
    els.map((a) => ({ text: (a.textContent || "").trim(), href: a.getAttribute("href") })),
  );
  const footerButtons = await page.locator("footer button").evaluateAll((els) =>
    els.map((b) => (b.textContent || "").trim()),
  );
  record("footerLinks", footerLinks);
  record("footerDeadButtons", footerButtons);

  // Privacy + Terms must be real, working links.
  for (const [label, expectedPath] of [["Privacy", "/privacy"], ["Terms", "/terms"]] as const) {
    const l = page.locator("footer").getByRole("link", { name: label, exact: true });
    expect(await l.getAttribute("href"), `${label} href`).toBe(expectedPath);
  }
});

// ---------------------------------------------------------------------------
// 6. Contrast audit — measure real computed colors on real DOM nodes
// ---------------------------------------------------------------------------
test("contrast ratios (WCAG AA)", async ({ page }) => {
  await gotoLanding(page);
  // Scroll through so every section has painted.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
    window.scrollTo(0, 0);
  });

  const samples: { name: string; sel: string; nth?: number }[] = [
    { name: "hero-subhead (ink-2 on cream)", sel: "section h1 + p" },
    { name: "hero-stat-label (ink-3 on cream)", sel: "section .uppercase" },
    { name: "eyebrow gold-deep on cream (#how)", sel: "#how span.uppercase" },
    { name: "how-step-desc (ink-2 on cream)", sel: "#how .grid .text-ink-2" },
    { name: "why-lede (ink-2 on cream-2)", sel: "#why .text-ink-2" },
    { name: "why-reason-desc (ink-2 on cream-2)", sel: "#why article .text-ink-2" },
    { name: "global-lede (ink-2 on cream)", sel: "#global .text-ink-2" },
    { name: "trust-desc (ink-2 on white)", sel: "#trust article .text-ink-2" },
    { name: "cta-door-desc (ink-2 on gold-light)", sel: "section:has-text('Two ways in') p" },
    { name: "cta-microcopy (gold-deep on gold-light)", sel: "section:has-text('Free for workers')" },
    { name: "footer-link (ink-2 on cream)", sel: "footer a" },
    { name: "footer-tagline (ink-2 on cream)", sel: "footer p" },
    { name: "footer-copyright (ink-3 on cream)", sel: "footer .text-ink-3 span" },
  ];

  const measured: Record<string, { color: string; bg: string; ratio: number; size: string; weight: string }> = {};
  for (const s of samples) {
    const el = page.locator(s.sel).nth(s.nth ?? 0);
    if ((await el.count()) === 0) continue;
    const info = await el.evaluate((node) => {
      const cs = getComputedStyle(node as Element);
      // Walk up for the first non-transparent background.
      let bgNode: Element | null = node as Element;
      let bg = "rgba(0, 0, 0, 0)";
      while (bgNode) {
        const b = getComputedStyle(bgNode).backgroundColor;
        if (b && b !== "rgba(0, 0, 0, 0)" && b !== "transparent") { bg = b; break; }
        bgNode = bgNode.parentElement;
      }
      return { color: cs.color, bg, size: cs.fontSize, weight: cs.fontWeight };
    });
    measured[s.name] = { ...info, ratio: contrast(info.color, info.bg) };
  }
  record("contrast", measured);

  // Assert body-text pairings meet AA 4.5:1 (soft — recorded, flagged not failed
  // hard so the whole report still generates).
  for (const [name, m] of Object.entries(measured)) {
    if (m.ratio < 4.5) console.log(`[CONTRAST FAIL] ${bp()} ${name}: ${m.ratio}:1 (color ${m.color} on ${m.bg}, ${m.size}/${m.weight})`);
  }
});

// ---------------------------------------------------------------------------
// 7. Spacing / layout audit — section vertical padding + content width + overflow
// ---------------------------------------------------------------------------
test("spacing, content width, and overflow", async ({ page }) => {
  await gotoLanding(page);

  const secSel = ["#how", "#why", "#global", "#trust"];
  const padding: Record<string, { pt: string; pb: string; maxW: string }> = {};
  for (const sel of secSel) {
    const el = page.locator(sel).first();
    if ((await el.count()) === 0) continue;
    padding[sel] = await el.evaluate((node) => {
      const cs = getComputedStyle(node as Element);
      const inner = (node as Element).querySelector("[class*='max-w']");
      return {
        pt: cs.paddingTop,
        pb: cs.paddingBottom,
        maxW: inner ? getComputedStyle(inner).maxWidth : "n/a",
      };
    });
  }
  record("sectionPadding", padding);

  // Horizontal overflow check at this breakpoint.
  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    overflowing: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));
  record("horizontalOverflow", overflow);
  expect(overflow.overflowing, `horizontal overflow at ${bp()}: ${overflow.scrollW}>${overflow.clientW}`).toBeFalsy();

  // Font-family split: headings serif, body sans.
  const fontCheck = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const h2 = document.querySelector("h2");
    const p = document.querySelector("section p");
    const ff = (e: Element | null) => (e ? getComputedStyle(e).fontFamily : "");
    return { h1: ff(h1), h2: ff(h2), body: ff(p) };
  });
  record("fontFamilies", fontCheck);
});
