---
paths:
  - "apps/web/**"
---

# Web — Tech Stack

- **Next.js `^16.2.4`** (App Router), **React `^19.0.0`**, **TypeScript `~5.9.2`** — built/served through Nx (`@nx/next` executor), not a local Next CLI.
- **Tailwind CSS `3.4.3`** for styling — see `anti-patterns.md`, this is the least mature part of the stack (no design tokens, no shared primitives).
- **Zustand `^5.0.13`** for client state (`src/stores/*`).
- **axios `^1.6.0`** wrapped in `src/lib/http.ts`, used only from Server Actions.
- **socket.io-client `^4.8.3`** for real-time (mock interview chat, notifications, kanban).
- **sonner `^2.0.7`** for toasts, wrapped by `src/lib/toast.ts`.
- **motion `^12.38.0`** for animation, **lucide-react `^1.7.0`** for icons, **recharts `^3.8.1`** for dashboard charts, **react-dnd `^16.0.1`** for the kanban board, **jwt-decode `^4.0.0`** for client-side JWT payload reads.
- No test runner wired up for this project — see `testing.md`.
