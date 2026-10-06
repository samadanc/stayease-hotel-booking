# hotel-booking-toolkit — a Kiro Power

A packaged Kiro power that loads booking/reservation expertise on demand. When
you mention a matching keyword (`booking`, `reservation`, `hotel`,
`availability`, `overbooking`, `scheduling`), Kiro loads this power's skill,
reference docs, and MCP configuration.

## Structure

```
hotel-booking-toolkit/
├── plugin.json                 # Required manifest (name, version, keywords)
├── mcp.json                    # Bundled MCP server (Playwright, for E2E)
└── skills/
    └── booking-availability/
        ├── SKILL.md            # Agent skill: booking best practices
        └── references/
            ├── property-testing.md
            └── ears-requirements.md
```

## What it bundles
- **Skill** (`SKILL.md`): half-open date ranges, peak-concurrency availability,
  overbooking prevention, cents-based money, validation vs availability, and
  turning requirements into property tests.
- **References**: copy-ready `fast-check` property templates and EARS requirement
  templates.
- **MCP**: a Playwright server so the agent can drive a browser to exercise the
  booking UI end-to-end.

## Install / use
This power ships inside the repository under `.kiro/powers/`. To share it
independently, publish this directory as a public GitHub repository — no special
approval is required. Kiro activates it automatically when a matching keyword
appears in the conversation; no manual import step is needed once it is on the
power path.

Keywords: `booking`, `reservation`, `hotel`, `availability`, `overbooking`,
`scheduling`.
