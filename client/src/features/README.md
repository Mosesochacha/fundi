# Features

Feature-based modules. Each feature owns its `services/` (axios calls only),
`hooks/` (TanStack Query), `types/`, and an `index.ts` barrel.

## Built (backend endpoints exist today)
- `auth` — login/register/otp/reset/verify, current user, sessions, account.
- `worker/{profile,portfolio,experience,certifications,education,availability}`
- `feed`, `posts`, `profiles`, `settings`

## Deferred (no backend yet — add when the API lands)
- `worker/requests`, `worker/reviews`
- `employer/{search,jobs,hires,reviews}`
- `messages` (UI currently uses Socket.io directly), `notifications`
- `admin/{workers,reports,flagged}`, `moderator/{reports,flagged}`
- `upload` — photo upload currently posts directly to the existing upload endpoint;
  promote to a feature hook once consolidated.

## Conventions
- Services return the raw axios promise; query hooks peel the envelope with
  `select: (res) => res.data.data` (backend wraps payloads as `{ success, message, data }`).
- Query keys are nested arrays for prefix invalidation: `['worker','profile',id]`,
  `['posts','comments',postId]`, `['profiles','browse',params]`, `['auth','me']`.
