# Squad Decisions

## Active Decisions

### E2E Test Infrastructure Improvements — Phase 1 (2026-04-02)
**Severity:** Critical + Major
**Owner:** McManus/Fenster (assigned by Keaton)
**Status:** P0 Complete ✓ → P1 in progress

**P0 (blocks reliability) — ✅ COMPLETE:**
- ✅ Replace all 13 `waitForTimeout()` calls with condition-based waits (Critical) — McManus
- ✅ Fix URL builder parameter casing: test sends camelCase, enum is lowercase, `URLSearchParams` is case-sensitive. This causes silent failures in production query handling. (Major) — McManus
- ✅ Fix vacuous assertion `toBeGreaterThanOrEqual(0)` → `toBeGreaterThan(0)` or `toBeVisible()` (Major) — McManus
- ✅ Bonus (P1): Add error discrimination to auth fixture catch block — now discriminates `TimeoutError` from real failures — McManus

**P1 (quality/maintainability) — ✅ COMPLETE:**
- ✅ Replace brittle `aria-expanded === null` leaf-node detection with `.monaco-tl-twistie.collapsible` CSS filter (Major) — Fenster
- ✅ Implement `storageState` auth caching for test speed — auth state cached in `.auth/storageState.json` (gitignored), reused on subsequent runs, force re-auth via `PP_FORCE_REAUTH=1` (Recommendation) — Fenster

**P2 (tech debt):**
- Add copyright header to `.env.example` (Minor)
- Remove duplicate `devices['Desktop Chrome']` from playwright config (Minor)
- Defer full POM adoption until test count exceeds 15 specs

**Related:** `.squad/orchestration-log/2026-04-02T07-13-hockney.md`, `.squad/orchestration-log/2026-04-02T07-20-keaton.md`, `.squad/orchestration-log/2026-04-02T07-28-mcmanus.md`, `.squad/orchestration-log/2026-04-02T07-35-fenster.md`

**Lead Decision:** Keaton reviewed all findings against actual code. Approved 8/10 findings as stated. Downgraded POM to Minor (premature for 5 specs), dismissed serial marker (config already enforces via `fullyParallel: false` + `workers: 1`). URL casing issue is worse than initially reported — likely causes production query failures. McManus completed all P0 items.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
