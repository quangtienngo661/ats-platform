---
paths:
  - "apps/web/**"
---

# Web — Testing

Frontend tests use Vitest and Testing Library: `npm run test:web`, configured by `apps/web/vitest.config.mts`. Keep `*.test.ts(x)` beside the behavior they verify. Backend tests continue to use Jest.

- Use meaningful regression tests for callbacks, first render data, route/store isolation, API failures and keyboard/focus behavior.
- Run `npm run typecheck:web`, `npm run lint:web`, `npm run test:web` and a production build. Lint uses Next Core Web Vitals, React Hooks and JSX accessibility with zero warnings.
- Browser journeys use Playwright: `npm run test:e2e:web`. Use `docker-compose.test.yml`, its sample fixtures and API port 55000. Never run fixture writes against the development database.
- `API_INTERNAL_URL` and `NEXT_PUBLIC_API_BASE_URL` must both target the test API during E2E. Start-web owns the Next process and checks local targets.
- CI tears down the test stack in an `always()` step; failed runs retain Playwright traces/screenshots.
- Preserve current layout, classes, colors and fonts when refactoring. Compare desktop/mobile screenshots and computed dimensions where a shared component or stylesheet is changed.
