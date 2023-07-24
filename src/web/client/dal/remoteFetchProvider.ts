/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import {
    convertContentToUint8Array,
    GetFileContent,
    GetFileNameWithExtension,
    isWebfileContentLoadNeeded,
    setFileContent,
} from "../utilities/commonUtil";
import { getCustomRequestURL, getRequestURL, updateEntityId } from "../utilities/urlBuilderUtil";
import { getCommonHeaders } from "../common/authenticationProvider";
import * as Constants from "../common/constants";
import { ERRORS, showErrorDialog } from "../common/errorHandler";
import { PortalsFS } from "./fileSystemProvider";
import {
    encodeAsBase64,
    getAttributePath,
    getEntity,
    isBase64Encoded,
} from "../utilities/schemaHelperUtil";
import WebExtensionContext from "../WebExtensionContext";
import { telemetryEventNames } from "../telemetry/constants";
import { entityAttributeNeedMapping, folderExportType, schemaEntityKey, schemaEntityName, schemaKey } from "../schema/constants";
import { getEntityNameForExpandedEntityContent, getRequestUrlForEntities } from "../utilities/folderHelperUtility";
import { IAttributePath, IFileInfo } from "../common/interfaces";
import { portal_schema_V2 } from "../schema/portalSchema";

export async function fetchDataFromDataverseAndUpdateVFS(
    portalFs: PortalsFS,
    defaultFileInfo?: IFileInfo,
) {
    try {
        const entityRequestURLs = getRequestUrlForEntities(defaultFileInfo?.entityId, defaultFileInfo?.entityName);
        const dataverseOrgUrl = WebExtensionContext.urlParametersMap.get(
            Constants.queryParameters.ORG_URL
        ) as string;
        await Promise.all(entityRequestURLs.map(async (entity) => {
            await fetchFromDataverseAndCreateFiles(entity.entityName, entity.requestUrl, dataverseOrgUrl, portalFs, defaultFileInfo);
            WebExtensionContext.telemetry.sendInfoTelemetry(
                telemetryEventNames.WEB_EXTENSION_FILES_LOAD_SUCCESS,
                { entityName: entity.entityName }
            );
        }));
    } catch (error) {
        const errorMsg = (error as Error)?.message;
        showErrorDialog(
            vscode.l10n.t("There was a problem opening the workspace"),
            vscode.l10n.t(
                "We encountered an error preparing the file for edit."
            )
        );
        WebExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_FAILED_TO_PREPARE_WORKSPACE, errorMsg, error as Error);
    }
}

async function fetchFromDataverseAndCreateFiles(
    entityName: string,
    requestUrl: string,
    dataverseOrgUrl?: string,
    portalFs?: PortalsFS,
    defaultFileInfo?: IFileInfo,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
    let requestSentAtTime = new Date().getTime();
    let makeRequestCall = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any[] = [];

    while (makeRequestCall) {
        try {
            WebExtensionContext.telemetry.sendAPITelemetry(
                requestUrl,
                entityName,
                Constants.httpMethod.GET,
                fetchFromDataverseAndCreateFiles.name
            );

            requestSentAtTime = new Date().getTime();
            const response = await WebExtensionContext.concurrencyHandler.handleRequest(requestUrl, {
                headers: {
                    ...getCommonHeaders(
                        WebExtensionContext.dataverseAccessToken
                    ),
                    Prefer: `odata.maxpagesize=${Constants.MAX_ENTITY_FETCH_COUNT}, odata.include-annotations="Microsoft.Dynamics.CRM.*"`,
                },
            });

            if (!response.ok) {
                makeRequestCall = false;
                throw new Error(JSON.stringify(response));
            }

            const result = await response.json();
            data = data.concat(result.value);
            if (result[Constants.ODATA_NEXT_LINK]) {
                makeRequestCall = true;
                requestUrl = result[Constants.ODATA_NEXT_LINK];
            } else {
                makeRequestCall = false;
            }

            if (result[Constants.ODATA_COUNT] !== 0 && data.length === 0) {
                vscode.window.showErrorMessage(
                    "microsoft-powerapps-portals.webExtension.fetch.nocontent.error",
                    "Response data is empty"
                );
                throw new Error(ERRORS.EMPTY_RESPONSE);
            }

            WebExtensionContext.telemetry.sendAPISuccessTelemetry(
                requestUrl,
                entityName,
                Constants.httpMethod.GET,
                new Date().getTime() - requestSentAtTime,
                fetchFromDataverseAndCreateFiles.name
            );

            if (portalFs && dataverseOrgUrl) {
                data = await preprocessData(data, entityName);
                for (let counter = 0; counter < data.length; counter++) {
                    await createContentFiles(
                        data[counter],
                        entityName,
                        portalFs,
                        dataverseOrgUrl,
                        undefined,
                        defaultFileInfo
                    );
                }
            }
        } catch (error) {
            makeRequestCall = false;
            const errorMsg = (error as Error)?.message;
            vscode.window.showErrorMessage(
                vscode.l10n.t("Failed to fetch some files.")
            );
            if ((error as Response)?.status > 0) {
                WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    entityName,
                    Constants.httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    fetchFromDataverseAndCreateFiles.name,
                    errorMsg,
                    '',
                    (error as Response)?.status.toString()
                );
            } else {
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    telemetryEventNames.WEB_EXTENSION_FETCH_DATAVERSE_AND_CREATE_FILES_SYSTEM_ERROR,
                    (error as Error)?.message,
                    error as Error
                );
            }
        }
    }

    if (defaultFileInfo === undefined) {
        WebExtensionContext.telemetry.sendInfoTelemetry(
            telemetryEventNames.WEB_EXTENSION_DATAVERSE_API_CALL_FILE_FETCH_COUNT,
            { entityName: entityName, count: data.length.toString() }
        );
    }

    return data;
}

async function createContentFiles(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any,
    entityName: string,
    portalsFS: PortalsFS,
    dataverseOrgUrl: string,
    filePathInPortalFS?: string,
    defaultFileInfo?: IFileInfo,
) {
    try {
        const lcid =
            WebExtensionContext.websiteIdToLanguage.get(
                WebExtensionContext.urlParametersMap.get(
                    Constants.queryParameters.WEBSITE_ID
                ) as string
            ) ?? "";
        WebExtensionContext.telemetry.sendInfoTelemetry(
            telemetryEventNames.WEB_EXTENSION_EDIT_LCID,
            { lcid: lcid ? lcid.toString() : "" }
        );

        let languageCode = WebExtensionContext.languageIdCodeMap.get(
            lcid
        ) as string;
        WebExtensionContext.telemetry.sendInfoTelemetry(
            telemetryEventNames.WEB_EXTENSION_WEBSITE_LANGUAGE_CODE,
            { languageCode: languageCode }
        );

        const entityDetails = getEntity(entityName);
        const attributes = entityDetails?.get(schemaEntityKey.ATTRIBUTES);
        const attributeExtension = entityDetails?.get(
            schemaEntityKey.ATTRIBUTES_EXTENSION
        );
        const mappingEntityFetchQuery = entityDetails?.get(
            schemaEntityKey.MAPPING_ATTRIBUTE_FETCH_QUERY
        );
        const exportType = entityDetails?.get(schemaEntityKey.EXPORT_TYPE);
        const portalFolderName = WebExtensionContext.urlParametersMap.get(
            Constants.queryParameters.WEBSITE_NAME
        ) as string;
        const subUri = entityDetails?.get(schemaEntityKey.FILE_FOLDER_NAME);
        const fetchedFileName = entityDetails?.get(
            schemaEntityKey.FILE_NAME_FIELD
        );
        const fetchedFileId = entityDetails?.get(schemaEntityKey.FILE_ID_FIELD);

        // Validate entity schema details
        if (subUri?.length === 0) {
            throw new Error(ERRORS.SUBURI_EMPTY);
        }

        if (!attributes || !attributeExtension) {
            throw new Error(ERRORS.ATTRIBUTES_EMPTY);
        }

        const entityId = fetchedFileId ? result[fetchedFileId] : null;
        if (!entityId) {
            throw new Error(ERRORS.FILE_ID_EMPTY);
        }

        const fileName = fetchedFileName
            ? result[fetchedFileName]
            : Constants.EMPTY_FILE_NAME;

        if (fileName === Constants.EMPTY_FILE_NAME) {
            throw new Error(ERRORS.FILE_NAME_EMPTY);
        }

        // Create folder paths
        filePathInPortalFS = filePathInPortalFS ?? `${Constants.PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/`;
        if (exportType && exportType === folderExportType.SubFolders) {
            filePathInPortalFS = `${filePathInPortalFS}${fileName}/`;
            await portalsFS.createDirectory(
                vscode.Uri.parse(filePathInPortalFS, true)
            );
        }

        const languageCodeAttribute = entityDetails?.get(
            schemaEntityKey.LANGUAGE_FIELD
        );

        if (languageCodeAttribute && result[languageCodeAttribute] === null) {
            throw new Error(ERRORS.LANGUAGE_CODE_ID_VALUE_NULL);
        }

        if (defaultFileInfo === undefined &&
            languageCodeAttribute &&
            result[languageCodeAttribute]) {
            const portalLanguageId =
                WebExtensionContext.websiteLanguageIdToPortalLanguageMap.get(
                    result[languageCodeAttribute]
                );

            languageCode = WebExtensionContext.portalLanguageIdCodeMap.get(
                portalLanguageId as string
            ) as string;

            WebExtensionContext.telemetry.sendInfoTelemetry(
                telemetryEventNames.WEB_EXTENSION_ENTITY_LANGUAGE_CODE,
                { languageCode: languageCode as string, entityId: entityId, entityName: entityName }
            );

            if (languageCode === Constants.DEFAULT_LANGUAGE_CODE || languageCode === undefined) {
                throw new Error(ERRORS.LANGUAGE_CODE_EMPTY);
            }
        }

        const attributeArray = attributes.split(",");
        await processDataAndCreateFile(attributeArray,
            attributeExtension,
            entityName,
            result,
            mappingEntityFetchQuery,
            entityId,
            dataverseOrgUrl,
            fileName,
            languageCode,
            filePathInPortalFS,
            portalsFS,
            defaultFileInfo)

    } catch (error) {
        const errorMsg = (error as Error)?.message;
        console.error(errorMsg);
        vscode.window.showErrorMessage(
            vscode.l10n.t("Failed to get file ready for edit.")
        );
        WebExtensionContext.telemetry.sendErrorTelemetry(
            telemetryEventNames.WEB_EXTENSION_CONTENT_FILE_CREATION_FAILED,
            errorMsg,
            error as Error
        );
    }
}

async function processDataAndCreateFile(
    attributeArray: string[],
    attributeExtension: string,
    entityName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any,
    mappingEntityFetchQuery: string | undefined,
    entityId: string,
    dataverseOrgUrl: string,
    fileName: string,
    languageCode: string,
    filePathInPortalFS: string,
    portalsFS: PortalsFS,
    defaultFileInfo?: IFileInfo,
) {
    const attributeExtensionMap = attributeExtension as unknown as Map<
        string,
        string
    >;
    let counter = 0;
    let fileUri = "";

    for (counter; counter < attributeArray.length; counter++) {
        const fileExtension = attributeExtensionMap?.get(
            attributeArray[counter]
        ) as string;
        const fileNameWithExtension = defaultFileInfo?.fileName ?? GetFileNameWithExtension(
            entityName,
            fileName,
            languageCode,
            fileExtension
        );
        const attributePath: IAttributePath = getAttributePath(
            attributeArray[counter]
        );

        const expandedContent = GetFileContent(result, attributePath);
        if (fileExtension === undefined && expandedContent !== Constants.NO_CONTENT) {
            await processExpandedData(
                entityName,
                expandedContent,
                portalsFS,
                dataverseOrgUrl,
                filePathInPortalFS);
        }
        else if (fileExtension !== undefined) {
            fileUri = filePathInPortalFS + fileNameWithExtension;
            await createFile(
                attributeArray[counter],
                fileExtension,
                fileUri,
                fileNameWithExtension,
                entityName,
                result,
                mappingEntityFetchQuery,
                entityId,
                dataverseOrgUrl,
                portalsFS
            );
        }
    }

    if (entityId === WebExtensionContext.defaultEntityId) {
        await WebExtensionContext.updateSingleFileUrisInContext(
            vscode.Uri.parse(fileUri)
        );
    }
}

async function processExpandedData(
    entityName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any,
    portalFs: PortalsFS,
    dataverseOrgUrl: string,
    filePathInPortalFS: string
) {
    // Load the content of the expanded entity
    for (let counter = 0; counter < result.length; counter++) {
        await createContentFiles(
            result[counter],
            getEntityNameForExpandedEntityContent(entityName),
            portalFs,
            dataverseOrgUrl,
            filePathInPortalFS
        );
    }
}

async function createFile(
    attribute: string,
    fileExtension: string,
    fileUri: string,
    fileNameWithExtension: string,
    entityName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any,
    mappingEntityFetchQuery: string | undefined,
    entityId: string,
    dataverseOrgUrl: string,
    portalsFS: PortalsFS
) {
    const base64Encoded: boolean = isBase64Encoded(
        entityName,
        attribute
    );

    // By default content is preloaded for all the files except for non-text webfiles for V2
    const isPreloadedContent = mappingEntityFetchQuery ? isWebfileContentLoadNeeded(fileNameWithExtension, fileUri) : true;

    // update func for webfiles for V2
    const attributePath: IAttributePath = getAttributePath(
        attribute
    );

    let fileContent = GetFileContent(result, attributePath);
    if (mappingEntityFetchQuery && isPreloadedContent) {
        fileContent = await getMappingEntityContent(
            mappingEntityFetchQuery,
            attribute,
            entityName,
            entityId,
            WebExtensionContext.dataverseAccessToken,
            dataverseOrgUrl
        );
    }

    await createVirtualFile(
        portalsFS,
        fileUri,
        convertContentToUint8Array(fileContent, base64Encoded),
        updateEntityId(entityName, entityId, result),
        attributePath,
        encodeAsBase64(entityName, attribute),
        entityName,
        fileNameWithExtension,
        result[attributePath.source] ?? Constants.NO_CONTENT,
        fileExtension,
        result[Constants.ODATA_ETAG],
        result[Constants.MIMETYPE],
        isPreloadedContent
    );
}

async function getMappingEntityContent(
    mappingEntityFetchQuery: string,
    attributeKey: string,
    entity: string,
    entityId: string,
    accessToken: string,
    dataverseOrgUrl: string
) {
    let requestSentAtTime = new Date().getTime();
    const mappingEntityFetchQueryMap =
        mappingEntityFetchQuery as unknown as Map<string, string>;
    const requestUrl = getRequestURL(
        dataverseOrgUrl,
        entity,
        entityId,
        Constants.httpMethod.GET,
        false,
        true,
        mappingEntityFetchQueryMap?.get(attributeKey) as string
    );

    WebExtensionContext.telemetry.sendAPITelemetry(
        requestUrl,
        entity,
        Constants.httpMethod.GET,
        getMappingEntityContent.name
    );
    requestSentAtTime = new Date().getTime();

    const response = await WebExtensionContext.concurrencyHandler.handleRequest(requestUrl, {
        headers: getCommonHeaders(accessToken),
    });

    if (!response.ok) {
        WebExtensionContext.telemetry.sendAPIFailureTelemetry(
            requestUrl,
            entity,
            Constants.httpMethod.GET,
            new Date().getTime() - requestSentAtTime,
            getMappingEntityContent.name,
            JSON.stringify(response),
            '',
            response?.status.toString()
        );
        throw new Error(response.statusText);
    }

    WebExtensionContext.telemetry.sendAPISuccessTelemetry(
        requestUrl,
        entity,
        Constants.httpMethod.GET,
        new Date().getTime() - requestSentAtTime,
        getMappingEntityContent.name
    );

    const result = await response.json();
    return result.value ?? Constants.NO_CONTENT;
}

export async function preprocessData(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    entityType: string
) {
    try {
        const schema = WebExtensionContext.urlParametersMap
            .get(schemaKey.SCHEMA_VERSION)
            ?.toLowerCase() as string;

        if (entityType === schemaEntityName.ADVANCEDFORMS && schema.toLowerCase() ===
            portal_schema_V2.entities.dataSourceProperties.schema) {
            entityType = schemaEntityName.ADVANCEDFORMSTEPS;
            const dataverseOrgUrl = WebExtensionContext.urlParametersMap.get(
                Constants.queryParameters.ORG_URL
            ) as string;
            const entityDetails = getEntity(entityType);
            const fetchedFileId = entityDetails?.get(schemaEntityKey.FILE_ID_FIELD);
            const formsData = await fetchFromDataverseAndCreateFiles(entityType, getCustomRequestURL(dataverseOrgUrl, entityType));
            const attributePath: IAttributePath = getAttributePath(
                entityAttributeNeedMapping.webformsteps
            );

            const advancedFormStepData = new Map();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formsData?.forEach((dataItem: any) => {
                const entityId = fetchedFileId ? dataItem[fetchedFileId] : null;
                if (!entityId) {
                    throw new Error(ERRORS.FILE_ID_EMPTY);
                }
                advancedFormStepData.set(entityId, dataItem);
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data?.forEach((dataItem: any) => {
                const webFormSteps = GetFileContent(dataItem, attributePath) as [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const steps: any[] = [];

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                webFormSteps?.forEach((step: any) => {
                    const formStepData = advancedFormStepData.get(step);

                    if (formStepData) {
                        steps.push(formStepData);
                    }
                });
                setFileContent(dataItem, attributePath, steps);
            });
            WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_PREPROCESS_DATA_SUCCESS, { entityType: entityType });
        }
    }
    catch (error) {
        const errorMsg = (error as Error)?.message;
        WebExtensionContext.telemetry.sendErrorTelemetry(
            telemetryEventNames.WEB_EXTENSION_PREPROCESS_DATA_FAILED,
            errorMsg,
            error as Error
        );
    }

    return data;
}

async function createVirtualFile(
    portalsFS: PortalsFS,
    fileUri: string,
    fileContent: Uint8Array,
    entityId: string,
    attributePath: IAttributePath,
    encodeAsBase64: boolean,
    entityName: string,
    fileName: string,
    originalAttributeContent: string,
    fileExtension: string,
    odataEtag: string,
    mimeType?: string,
    isPreloadedContent?: boolean
) {
    // Maintain file information in context
    await WebExtensionContext.updateFileDetailsInContext(
        fileUri,
        entityId,
        entityName,
        fileName,
        odataEtag,
        fileExtension,
        attributePath,
        encodeAsBase64,
        mimeType,
        isPreloadedContent
    );

    // Call file system provider write call for buffering file data in VFS
    await portalsFS.writeFile(
        vscode.Uri.parse(fileUri),
        fileContent,
        { create: true, overwrite: true }
    );

    // Maintain entity details in context
    await WebExtensionContext.updateEntityDetailsInContext(
        entityId,
        entityName,
        odataEtag,
        attributePath,
        originalAttributeContent
    );
}
