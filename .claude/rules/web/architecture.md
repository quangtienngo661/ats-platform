---
paths:
  - "apps/web/**"
---

# Web — Architecture & Key Decisions

- Auth routing lives in `src/proxy.ts` (Next.js middleware, exported as `proxy`): decodes the `accessToken` cookie client-side (`decodeTokenPayload`, via `jwt-decode`), checks `exp` without calling the API, and on expiry calls `POST /auth/refresh` directly (not through `lib/http.ts`) to rotate both cookies.
- Real-time: `GlobalSocketInit` (`src/components/common/GlobalSocketInit.tsx`) authenticates and opens the socket via `useSocketStore`, using `SOCKET_URL`. `InitSocketRoom` joins feature-specific rooms. Components read live events via `useSocketStore`'s `onEvent`/`offEvent` rather than holding their own `socket.io-client` instance.
- Dashboard chart data builders (trend lines, pipeline funnels) live in `src/lib/dashboard.utils.ts` — extend these for new dashboard visualizations instead of recomputing shapes ad hoc in a component.
- See the repo-root `README.md` for the full architecture diagram and the AI mock-interview phase-by-phase flow — it's kept current and is the best single reference for how this frontend fits the rest of the system.
