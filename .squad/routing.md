# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|----------|
| Webviews & panels | McManus | PortalWebView, NPSWebView, Copilot panel, webview message passing |
| Tree views & activity bar | McManus | Auth panel, env/solutions panel, Power Pages explorer, Actions Hub |
| Commands & UI | McManus | Command palette entries, URI handlers, quick picks |
| Language servers | Fenster | YAML autocomplete, HTML/Liquid server, intellisense |
| PAC CLI integration | Fenster | PacWrapper, CliAcquisition, CLI command execution |
| Services & common | Fenster | ArtemisService, BAPService, PPAPIService, telemetry, auth utils |
| Webpack & build | Fenster | webpack.config.js, multi-target build, bundling |
| Web extension | Fenster | src/web/ providers, remote fetch/save, file system |
| Webview UI/CSS | Redfoot | Visual design, theme variables, layout, icons, accessibility |
| Code review | Keaton | Review PRs, architecture quality, extension patterns |
| Architecture | Keaton | System design, extension manifest, cross-cutting concerns |
| Scope & priorities | Keaton | What to build next, trade-offs, decisions |
| Testing | Hockney | Unit tests, integration tests, Playwright e2e, coverage |
| Session logging | Scribe | Automatic — never needs routing |

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, assign `squad:{member}` label | Keaton |
| `squad:keaton` | Architecture/review issues | Keaton |
| `squad:mcmanus` | Extension UI issues — webviews, commands, tree views | McManus |
| `squad:fenster` | Server/CLI/build issues — language servers, PAC CLI, webpack | Fenster |
| `squad:redfoot` | Design/UX issues — webview styling, accessibility, icons | Redfoot |
| `squad:hockney` | Test issues — test gaps, test infra, coverage | Hockney |

### How Issue Assignment Works

1. When a GitHub issue gets the `squad` label, the **Lead** triages it — analyzing content, assigning the right `squad:{member}` label, and commenting with triage notes.
2. When a `squad:{member}` label is applied, that member picks up the issue in their next session.
3. Members can reassign by removing their label and adding another member's label.
4. The `squad` label is the "inbox" — untriaged issues waiting for Lead review.

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for "what port does the server run on?"
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn the tester to write test cases from requirements simultaneously.
7. **Issue-labeled work** — when a `squad:{member}` label is applied to an issue, route to that member. The Lead handles all `squad` (base label) triage.
