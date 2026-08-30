---
paths:
  - "apps/web/**"
---

# Web — Code Conventions

- **Server Actions layer** (`src/servers/<domain>/*.action.ts`) — components/pages must go through these `'use server'` functions, never call `lib/http.ts` or `fetch` directly from a component. This boundary is actually intact across the codebase (verified: `http` is imported only from `servers/*`).
- Paginated reads return `{ items, pagination }` — matches the API's response shape, don't reshape it.
- Mutations that affect a page's data call `revalidatePath(...)` after a successful write (see `applications.action.ts`).
- DTOs/interfaces returned by actions live in `src/types/interfaces/*.interface.ts`; actions frequently map a raw API DTO to a leaner UI-facing shape (e.g. `mapDtoToCard` in `applications.action.ts`).
- `lib/http.ts` is used only by Server Actions (reads `next/headers` cookies, can't run in Client Components). It injects `accessToken` as `Authorization: Bearer`, unwraps `response.data`, and redirects to `/sign-in?session_expired=true` on 401.
- **The hydrator pattern** (`src/components/hydrators/*`) — a Server Component fetches initial data via a Server Action, then renders an invisible `'use client'` component (returns `null`) whose only job is pushing that data into a Zustand store on mount (`KanbanHydrator`, `CvsHydrator`, `InterviewChatHydrator`). Use this for any new page that needs to seed client state from an SSR fetch — don't fetch client-side with `useEffect` in the page itself.
- Toasts go through `src/lib/toast.ts` (`toast.success/error/warning/info/loading/promise`), not `sonner` directly.
- User-facing strings (toasts, validation, error messages) are predominantly Vietnamese, matching the API's convention — follow this for new UI text.
- `src/types/constants/urls.ts` exports `SERVER_URL`/`SOCKET_URL` — import these instead of reading `process.env.NEXT_PUBLIC_*` inline (verified: no inline reads exist elsewhere today, keep it that way).
