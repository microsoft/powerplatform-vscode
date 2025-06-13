/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { RequestInit } from "node-fetch";
import * as vscode from "vscode";
import { getCommonHeadersForDataverse } from "../../../common/services/AuthenticationProvider";
import { BAD_REQUEST, MIMETYPE, queryParameters } from "../common/constants";
import { showErrorDialog } from "../../../common/utilities/errorHandlerUtil";
import { FileData } from "../context/fileData";
import { httpMethod } from "../common/constants";
import {
    getEntity,
    isWebFileV2,
    useOctetStreamContentType,
} from "../utilities/schemaHelperUtil";
import { getPatchRequestUrl, getRequestURL } from "../utilities/urlBuilderUtil";
import WebExtensionContext from "../WebExtensionContext";
import { IAttributePath } from "../common/interfaces";
import { webExtensionTelemetryEventNames } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { schemaEntityKey } from "../schema/constants";
import { getEntityMappingEntityId } from "../utilities/fileAndEntityUtil";

interface ISaveCallParameters {
    requestInit: RequestInit;
    requestUrl: string;
}

export async function saveData(fileUri: vscode.Uri) {
    const dataMap: Map<string, FileData> =
        WebExtensionContext.fileDataMap.getFileMap;
    const dataverseOrgUrl = WebExtensionContext.urlParametersMap.get(
        queryParameters.ORG_URL
    ) as string;
    const entityName = dataMap.get(fileUri.fsPath)?.entityName as string;
    const mappedEntity = getEntity(entityName)?.get(
        schemaEntityKey.MAPPING_ENTITY
    );
    const entityId = dataMap.get(fileUri.fsPath)?.entityId as string;

    const requestUrl = getRequestURL(
        dataverseOrgUrl,
        mappedEntity ?? entityName,
        getEntityMappingEntityId(entityId) ?? entityId,
        httpMethod.PATCH,
        true,
        false,
        undefined,
        mappedEntity
    );

    const fileDataMap = WebExtensionContext.fileDataMap.getFileMap;
    const saveCallParameters: ISaveCallParameters = await getSaveParameters(
        WebExtensionContext.dataverseAccessToken,
        requestUrl,
        fileUri,
        fileDataMap,
        fileDataMap.get(fileUri.fsPath)?.attributePath
    );

    await saveDataToDataverse(fileDataMap, fileUri, saveCallParameters);
}

async function getSaveParameters(
    accessToken: string,
    requestUrl: string,
    fileUri: vscode.Uri,
    fileDataMap: Map<string, FileData>,
    attributePath?: IAttributePath
): Promise<ISaveCallParameters> {
    const entityName = fileDataMap.get(fileUri.fsPath)?.entityName as string;
    const saveCallParameters: ISaveCallParameters = {
        requestInit: {
            method: httpMethod.PATCH,
        },
        requestUrl: requestUrl,
    };

    if (attributePath) {
        const webFileV2 = isWebFileV2(entityName, attributePath.source);

        saveCallParameters.requestInit.body = await getRequestBody(
            fileUri,
            fileDataMap,
            attributePath,
            webFileV2
        );

        saveCallParameters.requestInit.headers = getCommonHeadersForDataverse(
            accessToken,
            useOctetStreamContentType(entityName, attributePath.source)
        );
        if (webFileV2) {
            saveCallParameters.requestInit.headers = {
                ...saveCallParameters.requestInit.headers,
                "x-ms-file-name": fileDataMap.get(fileUri.fsPath)
                    ?.fileName as string,
            };
        }

        saveCallParameters.requestUrl = getPatchRequestUrl(
            entityName,
            attributePath.source,
            requestUrl
        );
    } else {
        WebExtensionContext.telemetry.sendErrorTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_GET_SAVE_PARAMETERS_ERROR,
            getSaveParameters.name,
            BAD_REQUEST
        ); // no API request is made in this case since we do not know in which column should we save the value
        showErrorDialog(
            vscode.l10n.t("Unable to complete the request"),
            vscode.l10n.t(
                "One or more attribute names have been changed or removed. Contact your admin."
            )
        );
    }

    return saveCallParameters;
}

async function getRequestBody(
    fileUri: vscode.Uri,
    fileDataMap: Map<string, FileData>,
    attributePath: IAttributePath,
    isWebFileV2: boolean
) {
    const data: { [k: string]: string } = {};
    const mimeType = fileDataMap.get(fileUri.fsPath)?.mimeType;
    const entityId = fileDataMap.get(fileUri.fsPath)?.entityId as string;

    const entityColumnContent =
        WebExtensionContext.entityDataMap.getColumnContent(
            entityId,
            attributePath.source
        ) as string;

    if (!isWebFileV2) {
        data[attributePath.source] = entityColumnContent;
        if (mimeType) {
            data[MIMETYPE] = mimeType;
        }
        return JSON.stringify(data);
    }

    return entityColumnContent;
}

async function saveDataToDataverse(
    fileDataMap: Map<string, FileData>,
    fileUri: vscode.Uri,
    saveCallParameters: ISaveCallParameters
) {
    if (saveCallParameters.requestInit.body) {
        const entityName = fileDataMap.get(fileUri.fsPath)
            ?.entityName as string;
        const requestSentAtTime = new Date().getTime();
        const fileExtensionType = fileDataMap.get(
            fileUri.fsPath
        )?.entityFileExtensionType;

        try {
            WebExtensionContext.telemetry.sendAPITelemetry(
                saveCallParameters.requestUrl,
                entityName,
                httpMethod.PATCH,
                saveDataToDataverse.name,
                fileExtensionType
            );
            WebExtensionContext.telemetry.sendInfoTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_DATAVERSE_SAVE_FILE_TRIGGERED
            );
            const response = await WebExtensionContext.concurrencyHandler.handleRequest(
                saveCallParameters.requestUrl,
                saveCallParameters.requestInit
            );

            if (!response.ok) {
                throw new Error(JSON.stringify(response));
            }

            WebExtensionContext.telemetry.sendAPISuccessTelemetry(
                saveCallParameters.requestUrl,
                entityName,
                httpMethod.PATCH,
                new Date().getTime() - requestSentAtTime,
                saveDataToDataverse.name,
                webExtensionTelemetryEventNames.WEB_EXTENSION_SAVE_DATA_TO_DATAVERSE_SUCCESS,
                fileExtensionType
            );
        } catch (error) {
            const authError = (error as Error)?.message;
            if ((error as Response)?.status > 0) {
                WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                    saveCallParameters.requestUrl,
                    entityName,
                    httpMethod.PATCH,
                    new Date().getTime() - requestSentAtTime,
                    saveDataToDataverse.name,
                    authError,
                    fileExtensionType,
                    (error as Response)?.status as unknown as string
                );
            } else {
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_SAVE_DATA_TO_DATAVERSE_API_ERROR,
                    saveDataToDataverse.name,
                    (error as Error)?.message,
                    error as Error
                );
            }

            if (typeof error === "string" && error.includes("Unauthorized")) {
                showErrorDialog(
                    vscode.l10n.t(
                        "Authorization Failed. Please run again to authorize it"
                    ),
                    vscode.l10n.t(
                        "There was a permissions problem with the server"
                    )
                );
            } else {
                showErrorDialog(
                    vscode.l10n.t("There’s a problem on the back end"),
                    vscode.l10n.t("Try again")
                );
            }

            throw error;
        }
    }
}
