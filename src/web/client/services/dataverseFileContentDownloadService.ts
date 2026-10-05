/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { getCommonHeadersForDataverse } from "../../../common/services/AuthenticationProvider";
import { ECSFeaturesClient } from "../../../common/ecs-features/ecsFeatureClient";
import { EnableWebFileBlockDownload } from "../../../common/ecs-features/ecsFeatureGates";
import { FileDownloadMode } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryInterface";
import WebExtensionContext from "../WebExtensionContext";
import { portalSchemaVersion } from "../common/constants";
import { schemaKey } from "../schema/constants";
import { downloadFileContent } from "./fileContentDownloadService";
import { webExtensionTelemetryEventNames as Events } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { schemaEntityName } from "../schema/constants";

/**
 * Adapts the browser downloader to existing Dataverse authentication, bulkhead and telemetry.
 */
export async function downloadDataverseFileContent(
    requestUrl: string, entityName: string, entityId: string, mode: FileDownloadMode,
    commit: (bytes: Uint8Array) => Promise<void>,
): Promise<void> {
    const properties = WebExtensionContext.schemaDataSourcePropertiesMap;
    const actionUrl = `${WebExtensionContext.orgUrl.replace(/\/$/, '')}/${properties.get(schemaKey.API)}/${properties.get(schemaKey.DATA)}/${properties.get(schemaKey.DATAVERSE_API_VERSION)}`;
    const { enableWebFileBlockDownload } = ECSFeaturesClient.getConfig(EnableWebFileBlockDownload);
    await downloadFileContent({
        requestUrl, actionUrl, entityId, mode, commit,
        schema: portalSchemaVersion.V2,
        featureEnabled: enableWebFileBlockDownload,
    }, {
        request: async (url, method, body, onRetry) => {
            const startedAt = Date.now();
            WebExtensionContext.telemetry.sendAPITelemetry(url, entityName, method, 'downloadFileContent');
            const response = await WebExtensionContext.concurrencyHandler.handleRequest(url, {
                method,
                headers: getCommonHeadersForDataverse(WebExtensionContext.dataverseAccessToken),
                body,
            }, () => WebExtensionContext.refreshDataverseToken(), onRetry);
            if (response.ok) {
                WebExtensionContext.telemetry.sendAPISuccessTelemetry(
                    url, entityName, method, Date.now() - startedAt, 'downloadFileContent', undefined, undefined, String(response.status)
                );
            } else {
                // Status-only diagnostics: action error bodies can contain continuation tokens.
                WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                    url, entityName, method, Date.now() - startedAt, 'downloadFileContent', `HTTP ${response.status}`, '', String(response.status)
                );
                if (response.status === 404 && method === 'GET') {
                    WebExtensionContext.telemetry.sendInfoTelemetry(
                        entityName === schemaEntityName.SERVERLOGICS ? Events.WEB_EXTENSION_SERVERLOGIC_NOT_FOUND : Events.WEB_EXTENSION_WEBFILE_NOT_FOUND,
                        { entityId, entity: entityName }
                    );
                }
            }
            return response;
        },
        telemetry: (event, data) => WebExtensionContext.telemetry.sendFileDownloadTelemetry(event, data),
    });
}
