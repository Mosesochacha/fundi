# QA audit — Tesilix landing page (`/`)

Playwright suite that loads the **real rendered** landing page against the local
dev server (logged-out, the actual visitor state — the page redirects
authenticated users to their dashboard), clicks every nav link / CTA / footer
link, and measures contrast, section spacing, font-family, and horizontal
overflow programmatically. Screenshots at desktop (1280), tablet (768), and
mobile (375) land in `screenshots/<breakpoint>/`.

## Run

```bash
# from repo root: dev server on :3000, backend on :9000
cd tests/qa-landing-page
node_modules/.bin/playwright test            # all 3 breakpoints
node_modules/.bin/playwright test --grep nav # a single check
BASE_URL=https://staging.example.com node_modules/.bin/playwright test
```

`node_modules` is a symlink to `../qa-employer-flow/node_modules` (shared
`@playwright/test` + system Chrome channel — no bundled browser download).

## What it checks (`landing.spec.ts`)

- **Screenshots** — full page + each section scrolled into view (reveal/marquee
  animations frozen for deterministic shots).
- **Console/page errors** — asserts a clean load.
- **Navbar** — every link's `href` + anchor scroll target; Browse workers
  actually navigates to `/browse`; mobile hamburger overlay.
- **Auth + CTAs** — Sign in/Sign up targets; every hero/section CTA has a href.
- **Footer** — real links resolve, flags dead `<button>` placeholders.
- **Contrast** — computed colors on real nodes vs WCAG AA (handles Tailwind v4
  `oklab()` opacity via an oklab→sRGB conversion).
- **Spacing/layout** — section vertical padding, 1080px content width, no
  horizontal overflow, serif-heading / sans-body font split.

Measurements are written to `test-results/audit-<breakpoint>.json`.
