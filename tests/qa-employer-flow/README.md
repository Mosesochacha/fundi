# QA regression suite — employer flow

Drives the local dev stack (Next.js :3000 + Express :9000) through the full
employer journey with Playwright, using a system-installed Google Chrome
(`channel: "chrome"` — no bundled browser download).

## Run

```bash
cd tests/qa-employer-flow
npm install          # first time only
npx playwright test  # runs setup (real UI signup + OTP verify) then the audit
```

`auth.setup.ts` registers a fresh employer through the real signup UI, reads the
verification OTP from Redis (via `backend/.env` REDIS_URL — the only out-of-band
step; the UI itself is exercised for real), verifies the email, and saves the
NextAuth session to `.auth/employer.json`.

`employer-flow.spec.ts` walks every scope page at 1280 / 768 / 375 px, captures
screenshots to `screenshots/<breakpoint>/`, records console errors + failed
requests to `screenshots/diagnostics.json`, and exercises search, filters,
worker profile, messaging, notifications, logout, and every sidebar nav item.

Prereqs: dev servers running, Redis reachable, seeded workers present.
