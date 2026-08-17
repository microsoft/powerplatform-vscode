/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Telemetry event names specific to URI handler functionality
 */
export enum uriHandlerTelemetryEventNames {
    URI_HANDLER_OPEN_POWER_PAGES_TRIGGERED = "UriHandlerOpenPowerPagesTriggered",
    URI_HANDLER_OPEN_POWER_PAGES_FAILED = "UriHandlerOpenPowerPagesFailed",
    URI_HANDLER_AUTH_REQUIRED = "UriHandlerAuthRequired",
    URI_HANDLER_AUTH_COMPLETED = "UriHandlerAuthCompleted",
    URI_HANDLER_ENV_SWITCH_REQUIRED = "UriHandlerEnvSwitchRequired",
    URI_HANDLER_ENV_SWITCH_COMPLETED = "UriHandlerEnvSwitchCompleted",
    URI_HANDLER_DOWNLOAD_STARTED = "UriHandlerDownloadStarted",
    URI_HANDLER_DOWNLOAD_COMPLETED = "UriHandlerDownloadCompleted",
    URI_HANDLER_FOLDER_OPENED = "UriHandlerFolderOpened",
    URI_HANDLER_PCF_INIT_TRIGGERED = "UriHandlerPcfInitTriggered",
    URI_HANDLER_METADATA_DIFF_IMPORT_TRIGGERED = "UriHandlerMetadataDiffImportTriggered",
    URI_HANDLER_AGENTIC_CREATE_TRIGGERED = "UriHandlerAgenticCreateTriggered",
    URI_HANDLER_AGENTIC_CREATE_DISABLED = "UriHandlerAgenticCreateDisabled",
    URI_HANDLER_AGENTIC_CREATE_FAILED = "UriHandlerAgenticCreateFailed",
    URI_HANDLER_PAC_CREATE_TRIGGERED = "UriHandlerPacCreateTriggered",
    URI_HANDLER_PAC_CREATE_DISABLED = "UriHandlerPacCreateDisabled",
    URI_HANDLER_PAC_CREATE_FAILED = "UriHandlerPacCreateFailed",
    URI_HANDLER_CREATE_AUTH_STARTED = "UriHandlerCreateAuthStarted",
    URI_HANDLER_CREATE_AUTH_COMPLETED = "UriHandlerCreateAuthCompleted",
    URI_HANDLER_CREATE_AUTH_FAILED = "UriHandlerCreateAuthFailed",
    URI_HANDLER_CREATE_ENVIRONMENT_SET = "UriHandlerCreateEnvironmentSet",
    URI_HANDLER_CREATE_FOLDER_SELECTED = "UriHandlerCreateFolderSelected",
    URI_HANDLER_CREATE_FOLDER_CANCELLED = "UriHandlerCreateFolderCancelled",
    URI_HANDLER_PAC_CREATE_PARAMS_COLLECTED = "UriHandlerPacCreateParamsCollected",
    URI_HANDLER_PAC_CREATE_TERMINAL_LAUNCHED = "UriHandlerPacCreateTerminalLaunched",
    URI_HANDLER_AGENTIC_CREATE_HOST_DETECTED = "UriHandlerAgenticCreateHostDetected",
    URI_HANDLER_AGENTIC_CREATE_HOST_SELECTED = "UriHandlerAgenticCreateHostSelected",
    URI_HANDLER_AGENTIC_CREATE_PLUGIN_SEQUENCE_LAUNCHED = "UriHandlerAgenticCreatePluginSequenceLaunched",
    URI_HANDLER_AGENTIC_CREATE_SAMPLE_PROMPT_SENT = "UriHandlerAgenticCreateSamplePromptSent",
    URI_HANDLER_CREATE_FLOW_DROPPED = "UriHandlerCreateFlowDropped",
    URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_PROMPTED = "UriHandlerAgenticCreateHostInstallPrompted",
    URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_GUIDE_OPENED = "UriHandlerAgenticCreateHostInstallGuideOpened",
    URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RECHECKED = "UriHandlerAgenticCreateHostInstallRechecked",
    URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RELOAD_REQUESTED = "UriHandlerAgenticCreateHostInstallReloadRequested",
    URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RESUMED = "UriHandlerAgenticCreateHostInstallResumed",
    URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_DISMISSED = "UriHandlerAgenticCreateHostInstallDismissed"
}
