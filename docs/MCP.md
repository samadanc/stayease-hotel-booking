# Model Context Protocol (MCP) — Playwright

This project uses the **Playwright MCP server** to let Kiro drive a real browser
against the running StayEase app: navigating pages, filling the search and
booking forms, clicking through to a confirmation, and reading the accessibility
tree to assert on results.

## Configuration

The server is registered in two places:

- **Workspace:** [`.kiro/settings/mcp.json`](../.kiro/settings/mcp.json) — committed
  so reviewers can see it in the repo.
- **Power bundle:** [`.kiro/powers/hotel-booking-toolkit/mcp.json`](../.kiro/powers/hotel-booking-toolkit/mcp.json)
  — shipped with the power so installing the power also wires up browser automation.

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "disabled": false
    }
  }
}
```

Prerequisite: Node.js with `npx` available. The first launch downloads
`@playwright/mcp`. Only install MCP servers from sources you trust.

## How it was used

With the app running (`PORT=3200 npm run serve`), Kiro used the Playwright MCP
tools to:

1. `browser_navigate` to `http://localhost:3200`.
2. `browser_snapshot` to read the accessibility tree and locate elements.
3. `browser_click` the **Search** button, then verify all four room cards render
   with correct per-stay totals (e.g. Deluxe King, 2 nights, $378.00).
4. `browser_click` **Book**, `browser_fill_form` the guest name/email, and
   `browser_click` **Confirm booking**.
5. `browser_find` the confirmation toast ("Booking confirmed! … $378.00 for 2
   night(s)") and re-read availability to confirm Deluxe King dropped from 5 to
   4 rooms left.

### A real bug the MCP caught

During step 3 the click timed out because a `hidden` modal overlay
(`position: fixed; inset: 0`) was intercepting pointer events — the `.modal {
display: flex }` rule was overriding the `hidden` attribute. The fix was a
`[hidden] { display: none !important; }` rule in `public/styles.css`. This is a
concrete example of MCP-driven testing surfacing a defect that unit tests could
not.

## Reproducible suite

The same flow is committed as a Playwright test in
[`tests/e2e/booking.spec.ts`](../tests/e2e/booking.spec.ts). Run it with:

```bash
npm run test:e2e:install   # one-time: download the chromium binary
npm run test:e2e           # boots the app and runs the browser flow
```
