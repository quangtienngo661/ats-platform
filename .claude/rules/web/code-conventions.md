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
- **Route stores** — CVs, Kanban and interview chat use `createRouteStore` providers initialized from Server Component data. Each route/SSR request owns its store. Initialize with lazy state before rendering consumers; never write a shared Zustand store during render. A provider key represents its route/data revision so a new server snapshot starts with the correct data.
- **Read errors** — only successful empty responses become empty lists. Failed reads throw to route `error.tsx`; a missing detail returns `null` only for a real 404. Client reads/polling handle rejection and offer feedback/retry.
- **Action errors** — use `lib/action-error.ts`; preserve Next.js redirects/notFound with `unstable_rethrow` before translating API validation messages. Do not show internal exception details in form feedback.
- **Dialogs** — use `AccessibleDialog`, `DialogOverlay asChild` and `DialogContent` with the existing panel elements/classes. Radix handles focus trapping, Escape and modal semantics; restore focus to the opener. Label form controls and icon buttons.
- **Callbacks and rich text** — post-login/logout destinations use `safeCallbackPath`; build login queries with `URLSearchParams`. Job HTML is sanitized on API write/read with the strict allowlist, and the editor pastes plain text.
- Toasts go through `src/lib/toast.ts` (`toast.success/error/warning/info/loading/promise`), not `sonner` directly.
- User-facing strings (toasts, validation, error messages) are predominantly Vietnamese, matching the API's convention — follow this for new UI text.
- `src/types/constants/urls.ts` exports `SERVER_URL`/`SOCKET_URL` — import these instead of reading `process.env.NEXT_PUBLIC_*` inline (verified: no inline reads exist elsewhere today, keep it that way).
