/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const Constants = {
    EventNames: {
        METADATA_DIFF_INITIALIZED: "metadataDiffInitialized",
        METADATA_DIFF_REFRESH_FAILED: "metadataDiffRefreshFailed",
        METADATA_DIFF_INITIALIZATION_FAILED: "metadataDiffInitializationFailed",
        METADATA_DIFF_CURRENT_ENV_FETCH_FAILED: "metadataDiffCurrentEnvFetchFailed",
    METADATA_DIFF_CLEAR_CALLED: "metadataDiffClearCalled",
    METADATA_DIFF_CLEAR_FAILED: "metadataDiffClearFailed",
    METADATA_DIFF_GET_CHILDREN_CALLED: "metadataDiffGetChildrenCalled",
    METADATA_DIFF_GET_CHILDREN_COMPLETED: "metadataDiffGetChildrenCompleted",
    METADATA_DIFF_SET_FILES_CALLED: "metadataDiffSetFilesCalled",
    METADATA_DIFF_SET_FILES_COMPLETED: "metadataDiffSetFilesCompleted",
    METADATA_DIFF_SET_FILES_FAILED: "metadataDiffSetFilesFailed",
        ORGANIZATION_URL_MISSING: "Organization URL is missing in the results.",
        EMPTY_RESULTS_ARRAY: "Results array is empty or not an array.",
        PAC_AUTH_OUTPUT_FAILURE: "pacAuthCreateOutput is missing or unsuccessful.",
    METADATA_DIFF_REPORT_FAILED: "metadataDiffReportFailed",
    // Enhanced telemetry events (added v1.1)
    METADATA_DIFF_TRIGGER_FLOW_CALLED: "metadataDiffTriggerFlowCalled",
    METADATA_DIFF_TRIGGER_FLOW_SUCCEEDED: "metadataDiffTriggerFlowSucceeded",
    METADATA_DIFF_TRIGGER_FLOW_FAILED: "metadataDiffTriggerFlowFailed",
    METADATA_DIFF_TRIGGER_FLOW_WITH_SITE_CALLED: "metadataDiffTriggerFlowWithSiteCalled",
    METADATA_DIFF_TRIGGER_FLOW_WITH_SITE_SUCCEEDED: "metadataDiffTriggerFlowWithSiteSucceeded",
    METADATA_DIFF_TRIGGER_FLOW_WITH_SITE_FAILED: "metadataDiffTriggerFlowWithSiteFailed",
    METADATA_DIFF_RESYNC_CALLED: "metadataDiffResyncCalled",
    METADATA_DIFF_RESYNC_SUCCEEDED: "metadataDiffResyncSucceeded",
    METADATA_DIFF_RESYNC_FAILED: "metadataDiffResyncFailed",
    METADATA_DIFF_DOWNLOAD_STARTED: "metadataDiffDownloadStarted",
    METADATA_DIFF_DOWNLOAD_COMPLETED: "metadataDiffDownloadCompleted",
    METADATA_DIFF_DOWNLOAD_FAILED: "metadataDiffDownloadFailed",
    METADATA_DIFF_DIFF_BUILD_STARTED: "metadataDiffDiffBuildStarted",
    METADATA_DIFF_DIFF_BUILD_COMPLETED: "metadataDiffDiffBuildCompleted",
    METADATA_DIFF_FILE_COUNTS: "metadataDiffFileCounts",
    METADATA_DIFF_NO_DIFFERENCES: "metadataDiffNoDifferences",
    METADATA_DIFF_OPEN_DIFF_CALLED: "metadataDiffOpenDiffCalled",
    METADATA_DIFF_OPEN_DIFF_SUCCEEDED: "metadataDiffOpenDiffSucceeded",
    METADATA_DIFF_OPEN_DIFF_FAILED: "metadataDiffOpenDiffFailed",
    METADATA_DIFF_DISCARD_LOCAL_CALLED: "metadataDiffDiscardLocalCalled",
    METADATA_DIFF_DISCARD_LOCAL_SUCCEEDED: "metadataDiffDiscardLocalSucceeded",
    METADATA_DIFF_DISCARD_LOCAL_FAILED: "metadataDiffDiscardLocalFailed",
    METADATA_DIFF_REPORT_GENERATE_CALLED: "metadataDiffReportGenerateCalled",
    METADATA_DIFF_REPORT_GENERATE_SUCCEEDED: "metadataDiffReportGenerateSucceeded",
    METADATA_DIFF_REPORT_GENERATE_FAILED: "metadataDiffReportGenerateFailed",
    METADATA_DIFF_REPORT_EXPORT_CALLED: "metadataDiffReportExportCalled",
    METADATA_DIFF_REPORT_EXPORT_SUCCEEDED: "metadataDiffReportExportSucceeded",
    METADATA_DIFF_REPORT_EXPORT_FAILED: "metadataDiffReportExportFailed",
    METADATA_DIFF_REPORT_IMPORT_CALLED: "metadataDiffReportImportCalled",
    METADATA_DIFF_REPORT_IMPORT_SUCCEEDED: "metadataDiffReportImportSucceeded",
    METADATA_DIFF_REPORT_IMPORT_FAILED: "metadataDiffReportImportFailed",
    METADATA_DIFF_PERF_SUMMARY: "metadataDiffPerfSummary",
    METADATA_DIFF_CLEAR_SUCCEEDED: "metadataDiffClearSucceeded",
    METADATA_DIFF_ROOT_RENDERED: "metadataDiffRootRendered",
    METADATA_DIFF_OPEN_COMPARISON_CALLED: "metadataDiffOpenComparisonCalled",
    METADATA_DIFF_OPEN_COMPARISON_FAILED: "metadataDiffOpenComparisonFailed",
    METADATA_DIFF_OPEN_COMPARISON_SUCCEEDED: "metadataDiffOpenComparisonSucceeded"
    }
};
export const SUCCESS = "Success";
