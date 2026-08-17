# Create-flow telemetry dashboard specification

This specification defines the intended analytics view for the dark Power Pages-to-VS Code create deep-link funnel. It is not a live-wired dashboard. The final OneDS table/view name and OII ingestion classification remain pending.

## Privacy contract

Queries may use only:

- Low-cardinality dimensions: `source`, `agentHost`, `version`, `region`, `channel`, `contractVersion`, `reason`
- Correlation: `correlationId`
- Presence flags: `hasEnvironmentId`, `hasOrgUrl`, `hasWebsiteId`, `hasTenantId`
- Requested record identifiers: `environmentId`, `websiteId`

Do not ingest or query organization URL values, tenant ID values, local folder paths, command text, prompts, or terminal contents. `hasOrgUrl` and `hasTenantId` are string-valued booleans and are the only allowed representations of those fields.

## Event-to-stage mapping

| Event | Channel | Funnel stage | Meaning |
|---|---|---|---|
| `UriHandlerAgenticCreateTriggered` | agent | Trigger | Enabled agent create flow accepted |
| `UriHandlerPacCreateTriggered` | pac | Trigger | Enabled PAC create flow accepted |
| `UriHandlerAgenticCreateDisabled` | agent | Trigger / gated | Agent create flow blocked by ECS |
| `UriHandlerPacCreateDisabled` | pac | Trigger / gated | PAC create flow blocked by ECS |
| `UriHandlerAgenticCreateFailed` | agent | Failure | Unhandled agent flow failure |
| `UriHandlerPacCreateFailed` | pac | Failure | Unhandled PAC flow failure |
| `UriHandlerCreateAuthStarted` | both | Auth | Authentication/environment preparation started |
| `UriHandlerCreateAuthCompleted` | both | Auth | Authentication/environment preparation completed |
| `UriHandlerCreateAuthFailed` | both | Auth / failure | Authentication/environment preparation failed |
| `UriHandlerCreateEnvironmentSet` | both | Environment | Target environment selected |
| `UriHandlerCreateFolderSelected` | both | Folder | Local target folder selected |
| `UriHandlerCreateFolderCancelled` | both | Folder / drop | Folder picker cancelled |
| `UriHandlerCreateFlowDropped` | both | Drop | Flow stopped; `reason` identifies classified drops when available |
| `UriHandlerAgenticCreateHostDetected` | agent | Host detect | Installed agent host detection completed |
| `UriHandlerAgenticCreateHostSelected` | agent | Host select | User selected the agent host |
| `UriHandlerAgenticCreateHostInstallPrompted` | agent | Host install | Missing-host installation prompt shown |
| `UriHandlerAgenticCreateHostInstallGuideOpened` | agent | Host install | Installation guide opened |
| `UriHandlerAgenticCreateHostInstallRechecked` | agent | Host install | Host installation rechecked |
| `UriHandlerAgenticCreateHostInstallReloadRequested` | agent | Host install | Extension reload requested |
| `UriHandlerAgenticCreateHostInstallResumed` | agent | Host resume | Create flow resumed after reload |
| `UriHandlerAgenticCreateHostInstallDismissed` | agent | Host install / drop | Installation guidance dismissed |
| `UriHandlerAgenticCreatePluginSequenceLaunched` | agent | Agent launch | Power Pages plugin sequence launched |
| `UriHandlerAgenticCreateSamplePromptSent` | agent | Agent launch | Sample prompt sent |
| `UriHandlerPacCreateParamsCollected` | pac | PAC params | PAC create parameters collected |
| `UriHandlerPacCreateTerminalLaunched` | pac | PAC terminal | PAC terminal launched |

## Normalized source view

Each example assumes the ingestion owner replaces `YourOneDSEventTable` and its projected columns with the approved OneDS source. The normalized view intentionally exposes only the privacy contract above.

```kusto
let CreateFlowEventNames = dynamic([
    "UriHandlerAgenticCreateTriggered",
    "UriHandlerPacCreateTriggered",
    "UriHandlerAgenticCreateDisabled",
    "UriHandlerPacCreateDisabled",
    "UriHandlerAgenticCreateFailed",
    "UriHandlerPacCreateFailed",
    "UriHandlerCreateAuthStarted",
    "UriHandlerCreateAuthCompleted",
    "UriHandlerCreateAuthFailed",
    "UriHandlerCreateEnvironmentSet",
    "UriHandlerCreateFolderSelected",
    "UriHandlerCreateFolderCancelled",
    "UriHandlerCreateFlowDropped",
    "UriHandlerAgenticCreateHostDetected",
    "UriHandlerAgenticCreateHostSelected",
    "UriHandlerAgenticCreateHostInstallPrompted",
    "UriHandlerAgenticCreateHostInstallGuideOpened",
    "UriHandlerAgenticCreateHostInstallRechecked",
    "UriHandlerAgenticCreateHostInstallReloadRequested",
    "UriHandlerAgenticCreateHostInstallResumed",
    "UriHandlerAgenticCreateHostInstallDismissed",
    "UriHandlerAgenticCreatePluginSequenceLaunched",
    "UriHandlerAgenticCreateSamplePromptSent",
    "UriHandlerPacCreateParamsCollected",
    "UriHandlerPacCreateTerminalLaunched"
]);
let CreateFlowEvents = materialize(
    YourOneDSEventTable
    | where timestamp between (ago(30d) .. now())
    | where eventName in (CreateFlowEventNames)
    | extend properties = todynamic(properties)
    | extend
        channel = case(
            tostring(properties.channel) in ("agent", "pac"), tostring(properties.channel),
            eventName startswith "UriHandlerAgentic", "agent",
            eventName startswith "UriHandlerPac", "pac",
            "unknown"),
        contractVersion = tostring(properties.contractVersion),
        correlationId = tostring(properties.correlationId),
        source = tostring(properties.source),
        agentHost = tostring(properties.agentHost),
        region = tostring(properties.region),
        reason = tostring(properties.reason),
        hasEnvironmentId = tostring(properties.hasEnvironmentId),
        hasOrgUrl = tostring(properties.hasOrgUrl),
        hasWebsiteId = tostring(properties.hasWebsiteId),
        hasTenantId = tostring(properties.hasTenantId)
    | project
        timestamp,
        eventName,
        channel,
        contractVersion,
        correlationId,
        source,
        agentHost,
        region,
        reason,
        hasEnvironmentId,
        hasOrgUrl,
        hasWebsiteId,
        hasTenantId
);
```

Disabled events predate the shared create-flow helper and therefore derive `channel` from their event names. Queries that require session-level conversion should filter out empty `correlationId` values and report their count separately.

## Funnel conversion

This query reports distinct correlated flows reaching each common stage, split by channel.

```kusto
CreateFlowEvents
| where isnotempty(correlationId)
| extend stage = case(
    eventName in ("UriHandlerAgenticCreateTriggered", "UriHandlerPacCreateTriggered"), "1 Trigger",
    eventName == "UriHandlerCreateAuthStarted", "2 Auth started",
    eventName == "UriHandlerCreateAuthCompleted", "3 Auth completed",
    eventName == "UriHandlerCreateEnvironmentSet", "4 Environment set",
    eventName == "UriHandlerCreateFolderSelected", "5 Folder selected",
    "")
| where isnotempty(stage)
| summarize flows=dcount(correlationId) by channel, stage
| order by channel asc, stage asc
```

## Drop-off by reason

Unclassified common-stage drops are grouped as `unspecified`; unsupported contract versions are classified as `unsupportedContractVersion`.

```kusto
CreateFlowEvents
| where eventName == "UriHandlerCreateFlowDropped"
| extend dropReason = iff(isempty(reason), "unspecified", reason)
| summarize drops=count(), correlatedFlows=dcountif(correlationId, isnotempty(correlationId))
    by channel, dropReason
| order by drops desc
```

## Channel split

```kusto
CreateFlowEvents
| where eventName in (
    "UriHandlerAgenticCreateTriggered",
    "UriHandlerPacCreateTriggered",
    "UriHandlerAgenticCreateDisabled",
    "UriHandlerPacCreateDisabled")
| extend disposition = iff(eventName endswith "Disabled", "gated", "triggered")
| summarize events=count() by channel, disposition
| order by channel asc, disposition asc
```

## Contract-version distribution

Disabled events do not currently carry the shared `contractVersion` property and are excluded from this distribution.

```kusto
CreateFlowEvents
| where isnotempty(contractVersion)
| summarize events=count(), correlatedFlows=dcountif(correlationId, isnotempty(correlationId))
    by channel, contractVersion
| order by channel asc, contractVersion asc
```
