# Squad Decisions

## Active Decisions

### E2E Test Infrastructure Improvements (2026-04-02)
**Severity:** Critical + Major
**Owner:** TBD
**Status:** Open

Replace all 13 hardcoded `waitForTimeout()` calls across e2e specs with condition-based waits. Adopt Page Object Model to avoid selector brittleness as test suite grows. Align URL builder query parameters with `src/web/client/common/constants.ts#queryParameters` enum.

**Related:** `.squad/orchestration-log/2026-04-02T07-13-hockney.md`

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
