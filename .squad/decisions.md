# Squad Decisions

## Active Decisions

### E2E Test Infrastructure Improvements — Phase 1 (2026-04-02)
**Severity:** Critical + Major
**Owner:** McManus/Fenster (assigned by Keaton)
**Status:** Open → P0 in progress

**P0 (blocks reliability):**
- Replace all 13 `waitForTimeout()` calls with condition-based waits (Critical)
- Fix URL builder parameter casing: test sends camelCase, enum is lowercase, `URLSearchParams` is case-sensitive. This causes silent failures in production query handling. (Major)
- Fix vacuous assertion `toBeGreaterThanOrEqual(0)` → `toBeGreaterThan(0)` or `toBeVisible()` (Major)

**P1 (quality/maintainability):**
- Add error discrimination to auth fixture catch block — currently swallows real errors (Major)
- Replace brittle `aria-expanded === null` leaf-node detection with robust pattern (Major)
- Implement `storageState` auth caching for test speed (Recommendation, assign to Fenster)

**P2 (tech debt):**
- Add copyright header to `.env.example` (Minor)
- Remove duplicate `devices['Desktop Chrome']` from playwright config (Minor)
- Defer full POM adoption until test count exceeds 15 specs

**Related:** `.squad/orchestration-log/2026-04-02T07-13-hockney.md`, `.squad/orchestration-log/2026-04-02T07-20-keaton.md`

**Lead Decision:** Keaton reviewed all findings against actual code. Approved 8/10 findings as stated. Downgraded POM to Minor (premature for 5 specs), dismissed serial marker (config already enforces via `fullyParallel: false` + `workers: 1`). URL casing issue is worse than initially reported — likely causes production query failures.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
