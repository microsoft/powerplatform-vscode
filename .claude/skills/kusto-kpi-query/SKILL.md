---
name: kusto-kpi-query
description: Generate any Kusto (KQL) query to track KPIs for VS Code extension features. Use when the user wants to analyze telemetry, track feature usage, measure adoption, investigate issues, or create dashboards. Not limited to templates - can create custom queries for any analysis need.
argument-hint: "<feature-name, event-name, or describe what you want to measure>"
---

# Generate Kusto KPI Queries for VS Code Extension Telemetry

You are tasked with generating Kusto Query Language (KQL) queries to track KPIs for the Power Platform VS Code extension. Use the Kusto MCP tools to verify queries work correctly.

**IMPORTANT**: You are NOT limited to the templates below. These are common patterns for reference, but you should create custom queries tailored to the user's specific needs. Use your knowledge of KQL to build any query - whether it involves complex aggregations, joins, time-series analysis, percentiles, machine learning functions, or anything else KQL supports.

## Step 1: Initialize Kusto Connection

First, connect to the telemetry cluster:

```
Use mcp__kusto-mcp__initialize-connection with:
- cluster_url: https://Powerportalseur.kusto.windows.net
- database: PowerPortalsAnalytics
```

## Step 2: Understand the Data Model

### Primary Telemetry Table
- **Table**: `PagesPowerPlatformExtEvent`
- **Cross-region union** (for complete data):
```kql
cluster('Powerportalseur').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
| union cluster('Powerportalsnam').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
```

### Key Columns
| Column | Description |
|--------|-------------|
| `ext_ingest_time` | Ingestion timestamp (use for time filtering) |
| `EventName` | Feature/action identifier (primary filter for features) |
| `EventType` | Event category (Trace, Error, etc.) |
| `EventInfo` | JSON with detailed event context (parse with `parse_json()`) |
| `TenantId` | Customer tenant identifier |
| `PrincipalObjectId` | User identifier |
| `ClientSessionId` | Session identifier |
| `VscodeExtensionVersion` | Extension version |
| `VscodeSurface` | Desktop or Web |
| `OsName` | Operating system |
| `ClientCountry` | User's country |
| `Severity` | Info, Warning, Error |
| `ErrorName` | Error identifier (for error tracking) |
| `ErrorStack` | Error stack trace |
| `Context` | JSON with org/env context (parse with `parse_json()`) |

### Common Event Name Patterns
- **ActionsHub***: Actions Hub feature events
- **WebExtension***: Web extension events
- **VSCodeDesktop***: Desktop-specific events
- **Copilot***: Copilot feature events
- **ServerApi***: Language server events
- **Preview***: Site preview events

## Step 3: Identify Feature Events

If a specific feature was provided, find related events:

```kql
PagesPowerPlatformExtEvent
| where ext_ingest_time >= ago(7d)
| where EventName contains "<feature-keyword>"
| summarize Count = count() by EventName
| order by Count desc
| take 20
```

Use `mcp__kusto-mcp__execute-query` to run this and identify the exact event names.

## Step 4: Generate KPI Queries

Based on the feature identified and the user's specific requirements, generate appropriate KQL queries. Use the templates below as reference patterns, but feel free to create entirely custom queries when needed.

### Custom Query Capabilities

You can create queries for any analysis, including but not limited to:
- **Time comparisons**: Week-over-week, month-over-month, custom date ranges
- **Statistical analysis**: Percentiles, standard deviation, variance, moving averages
- **Session analysis**: Session duration, events per session, session funnels
- **Cohort analysis**: Retention by signup week, feature adoption curves
- **Correlation analysis**: Events that occur together, user journeys
- **Anomaly detection**: Using KQL's series functions and ML capabilities
- **Custom aggregations**: Any combination of summarize, make_set, make_list, arg_max, etc.
- **Complex joins**: Joining with other tables or self-joins for sequence analysis
- **Dynamic JSON parsing**: Extract any nested field from EventInfo or Context

### Common Template Patterns (Reference)

### Template 1: Daily Active Users (DAU)
```kql
let events =
(
    cluster('Powerportalseur').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
    | union cluster('Powerportalsnam').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
);
events
| where ext_ingest_time >= ago(30d)
| where EventName in ("<EventName1>", "<EventName2>")
| extend Day = startofday(ext_ingest_time)
| summarize DAU = dcount(PrincipalObjectId) by Day
| order by Day asc
```

### Template 2: Feature Usage Count Over Time
```kql
let events =
(
    cluster('Powerportalseur').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
    | union cluster('Powerportalsnam').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
);
events
| where ext_ingest_time >= ago(30d)
| where EventName == "<EventName>"
| extend Day = startofday(ext_ingest_time)
| summarize UsageCount = count() by Day
| order by Day asc
```

### Template 3: Unique Tenants Using Feature
```kql
let events =
(
    cluster('Powerportalseur').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
    | union cluster('Powerportalsnam').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
);
events
| where ext_ingest_time >= ago(30d)
| where EventName in ("<EventName1>", "<EventName2>")
| summarize
    UniqueTenants = dcount(TenantId),
    UniqueUsers = dcount(PrincipalObjectId),
    TotalEvents = count()
```

### Template 4: Feature Adoption by Extension Version
```kql
let events =
(
    cluster('Powerportalseur').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
    | union cluster('Powerportalsnam').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
);
events
| where ext_ingest_time >= ago(30d)
| where EventName == "<EventName>"
| summarize
    Users = dcount(PrincipalObjectId),
    Events = count()
    by VscodeExtensionVersion
| order by Events desc
```

### Template 5: Desktop vs Web Usage
```kql
let events =
(
    cluster('Powerportalseur').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
    | union cluster('Powerportalsnam').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
);
events
| where ext_ingest_time >= ago(30d)
| where EventName == "<EventName>"
| summarize
    Users = dcount(PrincipalObjectId),
    Events = count()
    by VscodeSurface
| order by Events desc
```

### Template 6: Error Rate for Feature
```kql
let events =
(
    cluster('Powerportalseur').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
    | union cluster('Powerportalsnam').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
);
let total = events
| where ext_ingest_time >= ago(30d)
| where EventName startswith "<FeaturePrefix>"
| count;
let errors = events
| where ext_ingest_time >= ago(30d)
| where EventName startswith "<FeaturePrefix>"
| where Severity == "Error" or EventType == "Error"
| count;
print ErrorRate = todouble(toscalar(errors)) / todouble(toscalar(total)) * 100
```

### Template 7: Top Errors for Feature
```kql
let events =
(
    cluster('Powerportalseur').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
    | union cluster('Powerportalsnam').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
);
events
| where ext_ingest_time >= ago(30d)
| where EventName startswith "<FeaturePrefix>"
| where isnotempty(ErrorName) or Severity == "Error"
| summarize
    Count = count(),
    AffectedUsers = dcount(PrincipalObjectId)
    by ErrorName, EventName
| order by Count desc
| take 10
```

### Template 8: Geographic Distribution
```kql
let events =
(
    cluster('Powerportalseur').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
    | union cluster('Powerportalsnam').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
);
events
| where ext_ingest_time >= ago(30d)
| where EventName == "<EventName>"
| summarize
    Users = dcount(PrincipalObjectId),
    Events = count()
    by ClientCountry
| order by Users desc
| take 20
```

### Template 9: Weekly Trend with Growth Rate
```kql
let events =
(
    cluster('Powerportalseur').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
    | union cluster('Powerportalsnam').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
);
events
| where ext_ingest_time >= ago(90d)
| where EventName == "<EventName>"
| extend Week = startofweek(ext_ingest_time)
| summarize WAU = dcount(PrincipalObjectId) by Week
| order by Week asc
| extend PrevWAU = prev(WAU)
| extend GrowthRate = round((todouble(WAU) - todouble(PrevWAU)) / todouble(PrevWAU) * 100, 2)
```

### Template 10: Feature Funnel Analysis
```kql
let events =
(
    cluster('Powerportalseur').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
    | union cluster('Powerportalsnam').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
);
let timerange = ago(30d);
let step1 = events | where ext_ingest_time >= timerange | where EventName == "<Step1Event>" | distinct PrincipalObjectId;
let step2 = events | where ext_ingest_time >= timerange | where EventName == "<Step2Event>" | distinct PrincipalObjectId;
let step3 = events | where ext_ingest_time >= timerange | where EventName == "<Step3Event>" | distinct PrincipalObjectId;
print
    Step1_Users = toscalar(step1 | count),
    Step2_Users = toscalar(step2 | count),
    Step3_Users = toscalar(step3 | count),
    Step1_to_Step2_Rate = round(todouble(toscalar(step2 | count)) / todouble(toscalar(step1 | count)) * 100, 2),
    Step2_to_Step3_Rate = round(todouble(toscalar(step3 | count)) / todouble(toscalar(step2 | count)) * 100, 2)
```

### Template 11: Parse EventInfo for Detailed Metrics
```kql
let events =
(
    cluster('Powerportalseur').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
    | union cluster('Powerportalsnam').database('PowerPortalsAnalytics').PagesPowerPlatformExtEvent
);
events
| where ext_ingest_time >= ago(30d)
| where EventName == "<EventName>"
| extend EventData = parse_json(EventInfo)
| extend MethodName = tostring(EventData.methodName)
| summarize Count = count() by MethodName
| order by Count desc
```

## Step 5: Verify Query

Use `mcp__kusto-mcp__execute-query` to run the generated query and verify it returns valid results.

If the query fails:
1. Check event names exist using the discovery query from Step 3
2. Verify column names match the schema
3. Ensure JSON parsing is correct for dynamic columns

## Step 6: Present Results

Provide the user with:
1. The complete KQL query
2. A brief explanation of what the query measures
3. Sample results from verification
4. Suggestions for visualization (time series chart, pie chart, etc.)

## Common Feature Prefixes

| Feature | Event Prefix | Key Events |
|---------|--------------|------------|
| Actions Hub | `ActionsHub` | `ActionsHubRefresh`, `ActionsHubEnabled`, `ActionsHubInitialized` |
| Web Extension | `WebExtension`, `webExtension` | `WebExtensionApiRequest`, `WebExtensionSaveFileTriggered` |
| Authentication | `VSCodeDesktopUserAuthentication`, `DataVerseAuthentication` | Success/Failed events |
| Copilot | `Copilot` | `CopilotArtemisSuccessEvent`, `CopilotGovernanceCheckEnabled` |
| Site Preview | `Preview`, `EnableSiteRuntime` | `PreviewSiteInitialized`, `EnableSiteRuntimePreview` |
| Server API | `ServerApi` | `ServerApiAutocompleteActivate`, `ServerApiAutocompleteTriggered` |
| Search | `Search` | `WebExtensionSearchTextResults`, `WebExtensionSearchFile` |

## Important Notes

- Always use `ext_ingest_time` for time filtering (it's indexed)
- Use `dcount()` for unique counts (approximate but fast)
- For exact counts on small datasets, use `count(distinct ...)`
- The `Context` and `EventInfo` columns contain JSON - use `parse_json()` to extract fields
- For production dashboards, consider materializing common aggregations

## Flexibility Reminder

The templates above are starting points, not limitations. When the user asks for something specific like:
- "Show me 95th percentile latency" → Use `percentile()` function
- "Compare this week to last week" → Use time shifts and joins
- "Find users who did X but not Y" → Use set operations
- "Show me the sequence of events" → Use `prev()`, `next()`, or session windows
- "Detect anomalies" → Use `series_decompose_anomalies()` or similar
- "Moving average over 7 days" → Use `series_fir()` or window functions

Build the exact query they need using full KQL capabilities.
