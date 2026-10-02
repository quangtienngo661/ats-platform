---
paths:
  - "apps/web/**"
---

# Web — Architecture & Key Decisions

- The frontend uses Next.js 16 App Router, React 19, Tailwind CSS 3 and Zustand 5. Keep these versions/architecture unless the user authorizes an upgrade.
- Auth routing lives in `src/proxy.ts` (Next.js server Proxy): decodes the access cookie for early navigation and refreshes expired sessions via `POST /auth/refresh`. Forward both refreshed cookies into the current request before constructing its response. The Nest API decides authorization and tenant scope on every protected read/write; a decoded token or hidden menu never grants access.
- Real-time: `GlobalSocketInit` (`src/components/common/GlobalSocketInit.tsx`) authenticates and opens the socket via `useSocketStore`, using `SOCKET_URL`. `InitSocketRoom` joins feature-specific rooms. Components read live events via `useSocketStore`'s `onEvent`/`offEvent` rather than holding their own `socket.io-client` instance.
- Dashboard chart data builders (trend lines, pipeline funnels) live in `src/lib/dashboard.utils.ts` — extend these for new dashboard visualizations instead of recomputing shapes ad hoc in a component.
- See the repo-root `README.md` for the full architecture diagram and the AI mock-interview phase-by-phase flow — it's kept current and is the best single reference for how this frontend fits the rest of the system.
