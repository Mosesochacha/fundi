# Frontend Refactor: Redux/RTK → TanStack Query + Zustand + NextAuth v5

## Context

The Fundi client (`client/`, Next.js **16.2.6**, React 19, app router) currently runs all
state on **Redux Toolkit + RTK Query + redux-persist**:

- `store/apiSlice.ts` — one `createApi` with ~50 endpoints (auth, feed, posts, comments,
  profiles, settings, sessions, browse) and a 401/403 silent-refresh `baseQueryWithReauth`.
- `store/authSlice.ts` — `user` / `profile` / `accessToken` (in-memory) / `isLoggedIn`,
  persisted (`user`, `profile`, `isLoggedIn`) to localStorage; `accessToken` is in-memory only.
- `store/feedSlice.ts` — feed filter state; `store/searchSlice.ts` — unused.
- `components/Providers.tsx` mounts `<Provider>` + `<PersistGate>`; `components/LayoutShell.tsx`
  has a `SessionRestorer` (calls `getMe`) + `OnboardingGuard`.
- ~44 components/pages consume Redux (`useAppSelector`, `useAppDispatch`, RTK hooks).

We are replacing this with **TanStack Query** (server state) + **Zustand** (UI state) +
**NextAuth v5** (auth/session), reorganized into a **feature-based** `src/features/` tree.
Goal: simpler server-cache semantics, a single idiomatic auth source of truth, and code
colocated by domain — without breaking any existing live page.

### Decisions locked with the user
1. **NextAuth owns tokens.** access+refresh live in the NextAuth JWT; refresh happens in the
   `jwt` callback; axios reads the access token from the session. Single source of truth.
2. **Add a backend `/auth/google` endpoint** so Google sign-in actually yields backend tokens
   (the only sanctioned backend change).
3. **Real endpoints + migrate live only.** Build feature folders only where a backend route
   exists today, and migrate the existing live features into that structure. Do **not** scaffold
   stub services for not-yet-built backends (jobs, hires, messages, notifications, admin,
   moderator, reviews, worker-requests) — list them as deferred.

### Backend facts that constrain the design (verified)
- Base URL: **`http://localhost:5001/api/v1`** (env `NEXT_PUBLIC_API_URL`). Not `5000/api`.
- Login `POST /auth/login` → `{ data: { user, profile, tokens: { accessToken, refreshToken } } }`.
- Access token TTL **15m** (`JWT_ACCESS_EXPIRES=15m`); refresh TTL 30d.
- **`POST /auth/refresh` is cookie-only**: reads `lot_r1` httpOnly cookie, returns new
  `accessToken` in body, sets rotated `lot_r1` via `Set-Cookie` (no body refresh token, no
  Bearer support). Refresh rotates + revokes the old token.
- All protected endpoints accept `Authorization: Bearer <accessToken>`.
- Roles: `user | admin | moderator`; accountType: `worker | employer | null`. The app's
  functional "role" for routing = derive from `accountType` (worker/employer) and `role`
  (admin/moderator) — see Middleware section.

> ⚠️ **Next 16 caveat (from `client/AGENTS.md`):** this Next.js has breaking changes vs.
> training data. Before writing middleware / route handlers / providers, read the relevant
> files under `client/node_modules/next/dist/docs/01-app/`. Verify NextAuth v5 (`next-auth@beta`)
> middleware + route-handler patterns against the installed version.

---

## Phase 0 — Dependencies

In `client/`:
```
npm rm @reduxjs/toolkit react-redux redux-persist
npm i @tanstack/react-query @tanstack/react-query-devtools zustand next-auth@beta axios
```
Remove the three Redux packages from `package.json`. Keep `socket.io-client`, `zod`,
`react-hook-form`, `posthog-js`, etc.

`.env.local` (create; do not commit secrets):
```
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<…>
GOOGLE_CLIENT_SECRET=<…>
```

---

## Phase 1 — Core infra

### `src/lib/axios.ts` — single HTTP client
- `axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true })`.
- **Request interceptor:** get the access token from the NextAuth session and attach
  `Authorization: Bearer <token>`. In the browser, read it via `getSession()` from
  `next-auth/react` (cache the token in a module variable, refreshed on each session change, to
  avoid awaiting a network call per request). Do **not** read from localStorage (NextAuth owns
  tokens — decision 1).
- **Response interceptor:** on `401` with no `_retry` flag → set `_retry`, call
  NextAuth's session refresh (`getSession()` forces the `jwt` callback to run and rotate the
  token), re-read the token, retry. If still 401 → `signOut({ redirect: false })` then
  `window.location.href = "/login"`.
- Export the instance as default.

### `src/lib/queryClient.ts`
`new QueryClient({ defaultOptions: { queries: { staleTime: 5*60*1000, retry: 1,
refetchOnWindowFocus: false }, mutations: { retry: 0 } } })`. Export as `queryClient`.

### `src/lib/auth.ts` — NextAuth v5 config (the heart of the refactor)
`export const { handlers, auth, signIn, signOut } = NextAuth({ ... })`.

- **Providers:**
  - `Credentials` — fields `identifier`, `password`; `authorize()` `fetch`es
    `POST {API}/auth/login`, returns `{ id, email, name, role, accountType, user, profile,
    accessToken, refreshToken }`. The login `Set-Cookie` (`lot_r1`) is on the backend response;
    capture the refresh token value from the JSON body (`data.tokens.refreshToken`) so the jwt
    callback can forward it later.
  - `Google` — standard `GoogleProvider`. In the `signIn`/`jwt` callback, when the provider is
    Google, exchange the Google identity for backend tokens via the **new** `POST /auth/google`
    (Phase 5) and store the returned backend tokens in the JWT.
- **`jwt` callback:**
  - On initial sign-in: persist `accessToken`, `refreshToken`, `user`, `role`, and
    `accessTokenExpires = Date.now() + 15*60*1000` into the token.
  - On later calls: if `Date.now() < accessTokenExpires` return token unchanged; else call
    `refreshBackendToken(token.refreshToken)` — a helper that does
    `fetch(`${API}/auth/refresh`, { method:'POST', headers:{ Cookie: `lot_r1=${refreshToken}` }})`,
    reads the new `accessToken` from the body, and parses the rotated `lot_r1` out of the
    response's `Set-Cookie` header to store as the new `refreshToken`. Update `accessTokenExpires`.
    On failure set `token.error = "RefreshAccessTokenError"`.
- **`session` callback:** expose `session.user` (`{ id, name, email, role }`),
  `session.accessToken`, and `session.error`.
- `session: { strategy: "jwt" }`, `pages: { signIn: "/login" }`, `secret: NEXTAUTH_SECRET`.

### `src/app/api/auth/[...nextauth]/route.ts`
`export const { GET, POST } = handlers;` (re-export from `lib/auth.ts`).

### `src/types/next-auth.d.ts`
Augment `Session` (`user.{id,name,email,role}`, `accessToken`, `error`) and `JWT`
(`accessToken`, `refreshToken`, `accessTokenExpires`, `role`, `user`, `profile`, `error`) per spec.
Role type: `'worker' | 'employer' | 'admin' | 'moderator'`.

### `src/middleware.ts` — replace cookie-check with NextAuth
Replace the current `lot_r1` check with NextAuth's `auth` wrapper. Read docs first (Next 16 +
next-auth@beta middleware shape). Logic:
- Public bypass: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`,
  `/verify-email`, `/api/auth/*`, `/_next/*`, `/favicon.ico`.
- Protected groups `/worker/*`, `/employer/*`, `/admin/*`, `/moderator/*`: no session → `/login`;
  session with wrong role → redirect to that role's dashboard (`/{role}/dashboard`).
- Keep existing app routes (`/feed`, `/settings`, `/post`, `/messages`, `/setup`) protected →
  `/login` when unauthenticated (preserve current behavior). Auth-only pages redirect to the
  user's dashboard (or `/feed`) when already signed in.
- **Role derivation** (no single backend "role" field matches the 4 dashboards): map
  `role==='admin'→admin`, `role==='moderator'→moderator`, else `accountType` (`worker`/`employer`).
  Centralize in a `roleForUser(user)` helper in `lib/authRedirect.ts` (extend the existing file —
  it already houses `redirectPathForRole`).

### `src/components/Providers.tsx` — swap stacks
Replace `<Provider>`/`<PersistGate>` with:
```
<SessionProvider>
  <QueryClientProvider client={queryClient}>
    {children}
    {dev && <ReactQueryDevtools />}
  </QueryClientProvider>
</SessionProvider>
```
`app/layout.tsx` keeps `PostHogProvider > ToastProvider > Providers > LayoutShell`.

---

## Phase 2 — Zustand stores (`src/store/`)

Delete `index.ts`, `authSlice.ts`, `searchSlice.ts`, `apiSlice.ts`, `hooks.ts`. Replace with:
- `store/uiStore.ts` — `sidebarOpen` (true), `mobileDrawerOpen` (false), `activeModal` (null);
  actions `toggleSidebar`, `toggleDrawer`, `openModal`, `closeModal`.
- `store/searchStore.ts` — exactly the spec's filter state + actions (`selectedTrades`,
  `availableNow`, `verifiedOnly`, `certified`, `minRate` 500, `maxRate` 10000, `minRating` 0,
  `sortBy` 'best_match', `viewMode` 'list'; `toggleTrade`, `setFilter`, `resetFilters`,
  `setSortBy`, `setViewMode`).
- `store/feedStore.ts` — port `feedSlice` (`postType`, `dateRange`, `profession`, `location` +
  setters + `clearFilters` + a `hasActiveFilters` selector) so `components/FilterBar.tsx` and
  `RightSidebar` keep working. (Not in the spec's two stores, but required to migrate the live
  feed filters per decision 3.)

Each store: `create<State>()((set) => ({...}))`, plain Zustand (no persist needed — auth no
longer lives here).

---

## Phase 3 — Feature folders (`src/features/`)

**Patterns (apply to every file), per spec:**
- `services/*.service.ts` — only axios calls, `import client from '@/lib/axios'`; methods return
  the axios promise. No hooks/state.
- query hooks — `useQuery({ queryKey:[…nested…], queryFn, select: r => r.data.data })` (backend
  wraps payloads as `{ success, message, data }`, so `select` peels `res.data.data`).
- mutation hooks — `useMutation({ mutationFn, onSuccess: () => qc.invalidateQueries({ queryKey:
  [prefix] }) })`.
- `types/*.types.ts` — interfaces + string-literal unions only.
- `index.ts` — re-export services/hooks/types.
- Query-key conventions: nested arrays (`['worker','profile',id]`, `['feed',filters]`,
  `['posts','bySlug',slug]`, `['profiles','browse',filters]`, `['auth','me']`, …).

**Folders to BUILD (backend exists today):**

- `features/auth/` — services + hooks for: `useLogin` (wraps NextAuth `signIn('credentials')`),
  `useRegister`, `useForgotPassword`, `useResendOtp`, `useVerifyOtp`, `useResetPassword`,
  `useVerifyEmail`, `useResendVerification`, `useAuth` (thin wrapper over `useSession` +
  current-user), `useCurrentUser` (TanStack `['auth','me']` → `GET /auth/me`, enabled when a
  session exists — replaces the old `SessionRestorer`/`getMe`+`setCredentials`), `useLogout`
  (`signOut` + `queryClient.clear()`), plus account hooks `useChangePassword`, `useChangeEmail`,
  `useDeleteAccount`, and session hooks `useGetSessions`/`useRevokeSession`/`useRevokeAllSessions`/
  `useGetLoginHistory`. Types: `auth.types.ts` (port `AuthUser`/`AuthProfile`).
- `features/worker/profile|portfolio|experience|certifications|education|availability/` — full
  CRUD per `worker.routes.ts` (about/services/rate/service-area; photos add/delete; experience
  add/update/delete; certifications add/delete; education add/delete; `useGetProfile` for both
  `GET /worker/me/profile` and `GET /worker/:id/profile`; `useSetAvailability`).
- `features/feed/` — `useGetFeed` (`GET /feed`).
- `features/posts/` — `useGetPost`, `useGetPostBySlug`, `useCreatePost`, `useDeletePost`,
  `useToggleLike`, `useGetComments`, `useAddComment` (port the optimistic-update via
  `onMutate`/`setQueryData`/rollback), `useToggleCommentLike`, `usePolishPost`.
- `features/profiles/` — `useGetProfile`, `useGetProfilePosts`, `useToggleFollow`, `useBrowse`
  (`/profiles/browse`, reads `searchStore`), `useSearchProfiles`, `useCheckUsername`,
  `useCheckUsernamePublic`.
- `features/settings/` — `useUpdateProfile`, `useGet/UpdateNotifications`,
  `useGet/UpdatePrivacy`, `useGet/UpdatePreferences`, `usePublishProfile`, `useGenerateProfile`,
  `useGetProfileStats`/`Activity`/`Analytics`.
- `features/upload/` — `useUpload` if a Cloudinary endpoint is used by `StepPhotos`/avatar/banner
  (confirm endpoint during impl; otherwise fold into the relevant feature).

**Folders DEFERRED (no backend yet — do NOT scaffold):** `worker/requests`, `worker/reviews`,
all `employer/*`, `messages`, `notifications`, all `admin/*`, all `moderator/*`. Note them in a
short `features/README.md` as "pending backend".

---

## Phase 4 — Migrate the ~44 consumers (mechanical, pattern-repeated)

Replace, file by file:
- `useAppSelector(s => s.auth.isLoggedIn / s.auth.user)` → `useSession()` (status) +
  `useCurrentUser()` (rich user/profile).
- `useAppSelector(s => s.auth.profile)` → `useCurrentUser().data?.profile`.
- `useAppSelector(s => s.auth.accessToken)` → remove; axios attaches the token. For the few
  **manual `fetch()`** call sites (`app/feed/page.tsx`, `app/messages/*`,
  `components/worker/WorkerProfile.tsx`, `components/setup/manual/StepPhotos.tsx`,
  `components/dashboard/Shell.tsx`), switch to the `client` axios instance or the matching
  feature hook. `hooks/useSocket.ts` needs the raw token for the socket handshake → get it from
  `getSession()`/`useSession().data?.accessToken`.
- RTK hooks (`useLoginMutation`, `useGetFeedQuery`, `useBrowseProfilesQuery`,
  `useGetCommentsQuery`, settings hooks, …) → the corresponding `features/*` hooks.
- `dispatch(setCredentials(...))` → handled by NextAuth `signIn`; remove.
- `dispatch(logOut()) + apiSlice.util.resetApiState()` → `useLogout()` (`signOut` +
  `queryClient.clear()`). Files: `components/Navigation.tsx`, `components/settings/DangerZone.tsx`.
- `useAppDispatch` for feed filters → `useFeedStore()`; search filters → `useSearchStore()`.

**`components/LayoutShell.tsx`:** delete the Redux `SessionRestorer`; gate `OnboardingGuard` on
`useSession()` + `useCurrentUser()`. Keep all the path-based layout routing as-is.

**Login/register/forgot-password pages** (`app/login`, `app/register`, `app/forgot-password`)
already exist (untracked) and use RTK + `setCredentials` — rewire to the new `features/auth`
hooks; login calls `signIn('credentials', { redirect:false })` then routes via
`redirectPathForRole`. Wire the existing "Continue with Google" button (currently a
"coming soon" toast in `app/login/page.tsx`) to `signIn('google')` once Phase 5 lands.

Representative consumer files (not exhaustive): `components/Navigation.tsx`,
`components/BottomNav.tsx`, `components/FilterBar.tsx`, `components/PostCard.tsx`,
`components/post/CommentList.tsx`, `app/browse/page.tsx`, `app/feed/page.tsx`,
`app/profile/[username]/ProfileContent.tsx`, `app/settings/**`, `components/sidebar/*`,
`hooks/useProfileSetup.ts`, `hooks/useSocket.ts`, `components/dashboard/Shell.tsx`,
`components/worker/WorkerProfile.tsx`.

---

## Phase 5 — Backend `POST /auth/google` (only sanctioned backend change)

Add to `backend/src/routes/auth.routes.ts` + `auth.controller.ts` + `auth.service.ts`:
- `POST /auth/google` accepts a Google ID token (or access token), verifies it with
  `google-auth-library` (`OAuth2Client.verifyIdToken`), finds-or-creates the `User` by verified
  email (mark `emailVerified: true`; `accountType` may be null until onboarding), creates the
  `Profile` if missing, then issues the **same** `{ user, profile, tokens: { accessToken,
  refreshToken } }` shape as `/auth/login` and sets the `lot_r1` cookie via the existing
  `setAuthCookie` helper. Reuse `AuthService` token-issuing utilities (`auth.service.ts:254-260`).
- Add `GOOGLE_CLIENT_ID` to backend env. This is additive — no existing routes change.

---

## What to remove (cleanup checklist)
- `store/index.ts`, `store/authSlice.ts`, `store/feedSlice.ts` (ported to `feedStore`),
  `store/searchSlice.ts` (drop — unused), `store/apiSlice.ts`, `store/hooks.ts`.
- `components/Providers.tsx` PersistGate/Provider wiring (rewritten).
- All `useSelector/useDispatch/createSlice/createApi` imports across the app.
- redux deps from `package.json`.

## What to keep
- All UI components & page files (rewired, not rebuilt).
- Socket.io setup (token now from session), Cloudinary, Groq AI, Typesense.
- All backend routes except the additive `/auth/google`.

---

## Verification (end-to-end)

1. **Build/type:** `cd client && npm run build` (or `tsc --noEmit` / lint) — zero references to
   `@reduxjs/toolkit`, `react-redux`, `redux-persist`, `@/store/apiSlice`, `useAppSelector`.
   `grep -rn "react-redux\|redux-persist\|apiSlice\|useAppSelector\|useAppDispatch" client/src`
   returns nothing.
2. **Backends up:** start backend (`:5001`) + client (`:3000`).
3. **Auth happy path:** register → verify-email (OTP) → login via credentials → land on the
   role-correct dashboard. Confirm a NextAuth session cookie exists and `GET /auth/me` populates
   Navigation/avatar.
4. **Token refresh:** with `JWT_ACCESS_EXPIRES` temporarily short (e.g. `30s`), idle past expiry
   then trigger an API call — verify the `jwt` callback refreshes (network shows one
   `/auth/refresh`, request retried, no logout). Restore `15m`.
5. **Route protection:** as a worker, hit `/employer/dashboard` → redirected to
   `/worker/dashboard`; logged-out hit on `/settings` → `/login?next=…`.
6. **Live features:** feed loads + filters (feedStore); `/browse` with searchStore filters;
   open a post, like, add a comment (optimistic), follow a profile; a settings mutation persists.
7. **Worker profile CRUD:** edit about/services/rate, add+delete a portfolio photo, add+delete
   experience/certification/education, toggle availability.
8. **Logout:** clears session + `queryClient.clear()`; protected routes bounce to `/login`.
9. **Google (after Phase 5):** "Continue with Google" → `/auth/google` issues tokens → session
   established → API calls authorized.
10. Use the **/run** or **verify** skill to drive the app and confirm the above in-browser.

## Risks / notes
- **Next 16 + next-auth@beta**: middleware and route-handler signatures may differ from older
  docs — read `client/node_modules/next/dist/docs/01-app/` and the installed next-auth types
  before writing those files.
- **Cookie domain in prod**: the jwt-callback refresh forwards `lot_r1` explicitly via a `Cookie`
  header, so it works cross-origin in dev; in prod ensure the backend still accepts it (it reads
  `req.cookies.lot_r1` regardless of origin).
- Large surface (~44 consumers) — migrate per-feature, keep the app compiling between features by
  porting `feedStore`/`searchStore` and the `features/auth` `useCurrentUser` first.
- This is a single big-bang on a branch (removing `apiSlice` breaks all consumers at once);
  recommend a dedicated `refactor/state-tanstack-zustand-nextauth` branch.
