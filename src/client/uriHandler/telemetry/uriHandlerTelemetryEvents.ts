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
    URI_HANDLER_PCF_INIT_TRIGGERED = "UriHandlerPcfInitTriggered"
}
