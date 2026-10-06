---
inclusion: always
---

# Tech & Structure

## Stack
- **Language:** TypeScript (ES modules, `"type": "module"`), strict mode on.
- **Runtime:** Node.js ≥ 20.
- **Server:** Express 4.
- **Frontend:** plain HTML/CSS/vanilla JS in `public/` — no framework, no build
  step.
- **Tests:** Vitest (unit + property), `fast-check` (property-based), Playwright
  (E2E).
- **Lint:** ESLint with `@typescript-eslint`.

## Directory layout
```
src/
  domain/      pure business logic (no I/O): types, dates, booking engine
  store.ts     in-memory data layer
  app.ts       Express app factory
  server.ts    entry point
public/        static frontend
tests/
  unit/        example-based unit tests
  property/    property-based tests (fast-check)
  e2e/         Playwright end-to-end tests
.kiro/         specs, steering, hooks, agents, powers
```

## Conventions
- **Purity:** anything in `src/domain/` must be a pure function — no `Date.now()`
  reads for business decisions, no network, no mutation of inputs. This is what
  makes the property-based tests meaningful. Side effects (ids, timestamps) live
  in `src/store.ts`.
- **Dates:** always `YYYY-MM-DD` strings handled in UTC via `src/domain/dates.ts`.
  Never construct `new Date(string)` directly in business code.
- **Money:** integer cents only.
- **Errors:** API returns `{ errors: [{ field, message }] }`. Static validation
  → HTTP 400; availability conflict → HTTP 409.
- **Test hooks:** interactive UI elements carry a `data-test` attribute so
  Playwright selectors stay stable.
- **File headers:** every source file starts with a short block comment stating
  its responsibility.

## Commands
- `npm run serve` — run the app (tsx, no build).
- `npm run build` — compile TypeScript to `dist/`.
- `npm test` — unit + property tests.
- `npm run test:e2e` — Playwright E2E (boots its own server).
- `npm run lint` / `npm run typecheck` — static checks.
