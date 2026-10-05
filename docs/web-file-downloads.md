# Power Pages web file download recovery

## Scope and rollout

The VS Code **web** extension preserves the existing successful JSON/base64 GET
to `powerpagecomponents(id)/filecontent`. Only an HTTP **413** from that GET can
activate recovery for enhanced-model `powerpagecomponent.filecontent`: web files
and server-logic files when the existing server-logic feature is enabled.
Legacy annotation downloads, other legacy-model behavior, and uploads are unchanged.

The Power Pages ECS key `enableWebFileBlockDownload` controls recovery and defaults
to **false** when configuration is unavailable. Configure enabled and disabled
cohorts in ECS; this is not a new user setting. Both cohorts emit the same logical
load-start/completion contract, including the failed GET when recovery is disabled.

Recovery POSTs `InitializeFileBlocksDownload` with the logical target type
`Microsoft.Dynamics.CRM.powerpagecomponent`, `powerpagecomponentid`, and
`FileAttributeName: "filecontent"`. It validates the continuation token, nonnegative
safe-integer `FileSizeInBytes`, and boolean `IsChunkingSupported`. Sequential
`DownloadBlock` requests use at most 4 MiB (4,194,304 bytes), bounded by remaining
bytes. Each block is independently decoded, length-checked, and copied into one
preallocated `Uint8Array`. Exact multiples do not request an EOF block; empty files
request no blocks. Blocks are never concatenated as base64.

If chunking is unsupported, the documented full-size single-block request is used.
A permanent failure, including another 413, is unrecoverable and does not loop.
This is not a server-limit change or a guarantee for every storage configuration.
See [Microsoft Learn: download file-column data](https://learn.microsoft.com/power-apps/developer/data-platform/file-column-data#download-files).

Block actions retry only transient HTTP 408/429/500/502/503/504 responses, with at
most two additional HTTP attempts per action. Successful blocks are not repeated.
The existing handler still owns transport retries, bulkhead limits, and one 401
token refresh; the downloader does not add another transport retry loop.
`Retry-After` seconds and HTTP dates are honored. If the required wait exceeds the
existing 8-second maximum delay, recovery fails instead of retrying too early or
leaving the worker waiting indefinitely. Authentication, permission, not-found,
and oversized-request HTTP responses are not transient retries.

## Publication, errors, and memory

Preload, initially requested files, lazy opens, reloads, and enhanced ETag content
refreshes share recovery. Binary files remain lazy unless explicitly requested.
Unloaded placeholders are not successful downloads. Failed direct loads surface
`FileSystemError`; bulk loads continue unrelated records, report partial/failed
preparation, and notify the user. Failed preload content may remain as an unloaded,
retryable placeholder. A failed reload retains previous committed bytes/metadata.

Complete bytes are validated before the VFS write, and `isContentLoaded` is
published only after that write succeeds. Failed or malformed blocks cannot be
published as an empty success. Empty *valid* content is zero bytes, not a space.
Enhanced ETag refreshes preserve binary bytes and also publish valid empty updates.

There is no added client-side 16 MB cap. The reported cap's exact decimal/binary
definition and responding endpoint have not been reproduced on a live site.
104,000,000 bytes is about 99.18 MiB, not 104 MiB. Block recovery still needs a
contiguous output buffer plus the current decoded/base64 block, prior committed
content during reload, and browser/editor overhead. Browser allocation limits,
Dataverse permissions, file-column storage configuration, and endpoint availability
can prevent recovery. The unsupported-chunking case needs a full-size block and
therefore has higher peak memory. Allocation/validation failure is explicit.

## Telemetry and reliability contract

Every network-backed enhanced file-column load gets a fresh random
`downloadOperationId`, scoped to that logical load, and emits:

| Event | Meaning |
| --- | --- |
| `WebExtensionFileDownloadStarted` | One logical load starts, regardless of feature cohort. |
| `WebExtensionFileDownloadFallbackStarted` | The GET returned 413 and enabled recovery begins. |
| `WebExtensionFileDownloadCompleted` | Exactly one terminal outcome: `succeeded`, `failed`, `notFound`, or `cancelled`. |

Success means byte validation **and VFS publication**, not a successful GET, block,
or retry attempt. `cancelled` represents an aborted request/commit, not an invented
timeout. Host termination can leave a start without a terminal; report that
operation as incomplete rather than as proven server failure.

Properties are `downloadOperationId`, `mode` (`preload`, `initial`, `lazy`, `reload`,
`etag`), `schema`, `featureEnabled`, `mechanism` (`get`, `blocks`, `singleBlock`),
available initial/final HTTP status, `sizeBucket`, validated `blockCount`, actual
`retryCount` (HTTP retries plus shared transport/auth retries), `durationMs`, and
terminal `outcome`/`failureStage`. Size buckets are `unknown`, `empty`, `upTo4MiB`,
`4To16MiB`, `16To128MiB`, and `over128MiB`. Unknown size is not fabricated when
initialization fails. Final status is the last available HTTP response; a 200
with failure stage `validation` or `commit` is still a failed logical download.
Durations/counts are serialized as properties in `EventInfo`.

Logical events contain no filenames, content, request bodies, bearer tokens,
continuation tokens, or record IDs. Existing raw API diagnostics retain statuses,
including the initial 413, separately; block-action error bodies are not logged
because they could contain private continuation tokens.

**Recovery rate** = succeeded logical loads after fallback / logical loads entering
fallback. **Overall reliability** = succeeded logical loads / logical starts.
Incomplete loads stay in the started denominator. Raw attempts, block successes,
and retries never add logical downloads. The raw 413 rate need not fall: the first
GET is intentionally preserved. Compare identically instrumented enabled/disabled
cohorts, not the old raw-API denominator with the new logical denominator.

## Correlated dashboard query

This proposed KQL has **not been verified against deployed logical download
events**. Authorized NAM queries, including cross-cluster EUR access, confirmed
existing raw GET 413 events, their `EventInfo` mapping, and the `Web` surface value.
Queries for the three new logical events returned no records; their ingestion
and property mapping remain unverified. Event absence is not 0% recovery or proof
of a logging failure. Local emitter tests and synthetic aggregation arithmetic
are not evidence of deployed recovery.

The one-hour reporting grace window below is not a downloader timeout. Tune it
from observed duration. Deduplicate ingestion by session and operation ID;
separately monitor duplicate/contradictory terminal events. Contradictory outcomes
are not counted as reliable success.

```kql
let Events = materialize(
    union
        cluster('Powerportalseur').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent,
        cluster('Powerportalsnam').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
    | where ext_ingest_time >= ago(7d)
    | where VscodeSurface =~ "Web"
    | where EventName in (
        "WebExtensionFileDownloadStarted",
        "WebExtensionFileDownloadFallbackStarted",
        "WebExtensionFileDownloadCompleted")
    | extend Info = parse_json(EventInfo)
    | extend OperationId = tostring(Info.downloadOperationId)
    | where isnotempty(OperationId)
    | project ext_ingest_time, EventName, ClientSessionId,
        VscodeExtensionVersion, OperationId, Info
);
let Starts = Events
    | where EventName == "WebExtensionFileDownloadStarted"
    | summarize arg_min(ext_ingest_time, VscodeExtensionVersion, Info)
        by ClientSessionId, OperationId
    | where ext_ingest_time < ago(1h)
    | project ClientSessionId, OperationId,
        Day = startofday(ext_ingest_time), Version = VscodeExtensionVersion,
        FeatureEnabled = tostring(Info.featureEnabled),
        Mode = tostring(Info.mode), Schema = tostring(Info.schema);
let Fallbacks = Events
    | where EventName == "WebExtensionFileDownloadFallbackStarted"
    | summarize HadFallback = max(1) by ClientSessionId, OperationId;
let Outcomes = Events
    | where EventName == "WebExtensionFileDownloadCompleted"
    | summarize TerminalEvents = count(),
        OutcomeSet = make_set(tostring(Info.outcome)),
        arg_max(ext_ingest_time, Info)
        by ClientSessionId, OperationId
    | project ClientSessionId, OperationId, TerminalEvents,
        Outcome = iff(array_length(OutcomeSet) == 1,
            tostring(Info.outcome), "conflicting"),
        DurationMs = todouble(Info.durationMs);
Starts
| join kind=leftouter Fallbacks on ClientSessionId, OperationId
| join kind=leftouter Outcomes on ClientSessionId, OperationId
| summarize
    Started = count(),
    Succeeded = countif(Outcome == "succeeded"),
    Failed = countif(Outcome == "failed"),
    NotFound = countif(Outcome == "notFound"),
    Cancelled = countif(Outcome == "cancelled"),
    Incomplete = countif(isempty(Outcome)),
    Conflicting = countif(Outcome == "conflicting"),
    MultipleTerminalEvents = countif(TerminalEvents > 1),
    EnteredFallback = countif(HadFallback == 1),
    Recovered413 = countif(HadFallback == 1 and Outcome == "succeeded"),
    FailedAfter413 = countif(HadFallback == 1 and Outcome == "failed"),
    IncompleteAfter413 = countif(HadFallback == 1 and isempty(Outcome)),
    P50SuccessfulMs = percentile(
        iff(Outcome == "succeeded", DurationMs, real(null)), 50),
    P95SuccessfulMs = percentile(
        iff(Outcome == "succeeded", DurationMs, real(null)), 95)
    by Day, Version, FeatureEnabled, Mode, Schema
| extend
    FileLoadReliabilityPct = 100.0 * Succeeded / Started,
    Recovery413Pct = iff(EnteredFallback > 0,
        100.0 * Recovered413 / EnteredFallback, real(null))
| order by Day asc, Version asc, FeatureEnabled asc
```

Use daily reliability/recovery time series with version and feature cohorts.
For terminal failure diagnostics, deduplicate completion events by the same
session/operation keys, then group by `failureStage`, `finalHttpStatus`,
`sizeBucket`, `mechanism`, `blockCount`, and `retryCount`. Keep unknown-size and
incomplete operations visible in the main start-based metric.

## Validation and live acceptance

Focused Mocha/Chai/Sinon coverage exercises byte-exact 18,000,000- and
104,000,000-byte patterned fixtures, 4 MiB +/- 1 boundaries, exact multi-block
multiples, empty files, malformed base64/metadata/lengths, allocation errors,
transient recovery/exhaustion, unsupported chunking, feature cohorts, shared 401
refresh, publication failure, partial preparation, lazy/initial/reload/ETag flows,
and legacy preservation. These are mocked protocol/VFS checks, not live downloads.

The user verified a successful approximately 32 MB file load on an authorized
existing enhanced-model site using the locally served extension with recovery
enabled. This is one user-verified live load, not an independently captured
GET/block trace, exact byte/hash comparison, memory/latency measurement, or
production recovery rate.

Before enabling broad rollout, use an authorized existing site to reproduce a
real enhanced GET 413, capture sanitized endpoint/status details, and byte-match
the same 18-104 MB records against a trusted reference after fallback. Exercise
reload, small/legacy content, permissions failure, and browser memory/latency.
Verify successful and deliberately failed recovery events in both regional
clusters, the `EventInfo` property mapping, and the query. Do not provision a
tenant, change server/storage limits, or infer live recovery from mocked tests.
