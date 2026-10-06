# StayEase — Hotel Booking

A small full-stack hotel booking web app built for the **Kiro University
Challenge**. A guest searches rooms by date range and party size, sees live
availability and total price, and books a room. The booking engine guarantees it
**never overbooks** — a guarantee enforced by property-based tests.

This repository's primary purpose is to demonstrate all seven Kiro lessons (plus
both bonuses). See [Kiro lessons demonstrated](#kiro-lessons-demonstrated).

## Quick start

```bash
npm install
npm run serve          # http://localhost:3000
```

Other commands:

```bash
npm run build          # compile TypeScript to dist/
npm test               # unit + property-based tests (Vitest + fast-check)
npm run test:e2e       # Playwright end-to-end (boots its own server)
npm run lint           # ESLint
```

## Architecture

```
src/
  domain/      pure business logic (no I/O): types, dates, booking engine
  store.ts     in-memory data layer (seed rooms + bookings)
  app.ts       Express app factory (REST API)
  server.ts    entry point
public/        static frontend (vanilla HTML/CSS/JS)
tests/
  unit/        example-based unit tests
  property/    property-based tests (fast-check)
  e2e/         Playwright end-to-end tests
.kiro/         Kiro configuration (see below)
```

All booking rules live in `src/domain/` as pure functions, which is what makes
the property-based tests meaningful. See
[`.kiro/specs/hotel-booking/design.md`](.kiro/specs/hotel-booking/design.md).

## REST API

| Method | Path | Description |
|---|---|---|
| GET | `/api/rooms` | List room types |
| GET | `/api/availability?checkIn&checkOut&guests` | Search availability |
| POST | `/api/bookings` | Create a booking (400 invalid, 409 no availability) |
| GET | `/api/bookings` | List bookings |
| GET | `/api/health` | Health probe |

## Kiro lessons demonstrated

| # | Lesson | Where in this repo |
|---|---|---|
| 1 | **Spec-driven development** | [`.kiro/specs/hotel-booking/`](.kiro/specs/hotel-booking/) — EARS `requirements.md`, `design.md`, `tasks.md` |
| 2 | **Steering documents** | [`.kiro/steering/`](.kiro/steering/) — `product.md`, `tech.md`, `conventions.md` |
| 3 | **Hooks** | [`.kiro/hooks/`](.kiro/hooks/) — `lint-on-save.json`, `test-on-domain-change.json` |
| 4 | **Property-based testing** | [`tests/property/booking.property.test.ts`](tests/property/booking.property.test.ts) |
| 5 | **Powers** | [`.kiro/powers/hotel-booking-toolkit/`](.kiro/powers/hotel-booking-toolkit/) |
| 6 | **MCP** | [`.kiro/settings/mcp.json`](.kiro/settings/mcp.json) + [`docs/MCP.md`](docs/MCP.md) |
| 7 | **Custom agents** | [`.kiro/agents/booking-engineer.json`](.kiro/agents/booking-engineer.json) |
| Bonus 2 | **Package a Kiro power** | [`.kiro/powers/hotel-booking-toolkit/plugin.json`](.kiro/powers/hotel-booking-toolkit/plugin.json) |

A deeper writeup of the MCP-driven testing (Lesson 6) is in
[`docs/MCP.md`](docs/MCP.md).

## Built with Kiro

Every file here was produced in a Kiro session, driven by the specs and steering
in `.kiro/`.
