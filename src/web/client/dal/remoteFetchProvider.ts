/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import {
    convertContentToUint8Array,
    GetFileNameWithExtension,
    getAttributeContent,
    getSanitizedFileName,
    isPortalVersionV1,
    isPortalVersionV2,
    isWebfileContentLoadNeeded,
    setFileContent,
    isNullOrUndefined,
    getDuplicateFileName,
} from "../utilities/commonUtil";
import { getCustomRequestURL, getMappingEntityContent, getMetadataInfo, getMappingEntityId, getMimeType, getRequestURL } from "../utilities/urlBuilderUtil";
import { getCommonHeadersForDataverse } from "../../../common/services/AuthenticationProvider";
import * as Constants from "../common/constants";
import { PortalsFS } from "./fileSystemProvider";
import {
    encodeAsBase64,
    getAttributePath,
    getEntity,
    getEntityParameters,
    isBase64Encoded,
} from "../utilities/schemaHelperUtil";
import WebExtensionContext from "../WebExtensionContext";
import { webExtensionTelemetryEventNames } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { EntityMetadataKeyCore, SchemaEntityMetadata, folderExportType, schemaEntityKey, schemaEntityName, schemaKey } from "../schema/constants";
import { getEntityNameForExpandedEntityContent, getRequestUrlForEntities } from "../utilities/folderHelperUtility";
import { IAttributePath, IFileInfo } from "../common/interfaces";
import { portal_schema_V2 } from "../schema/portalSchema";
import { ERROR_CONSTANTS } from "../../../common/ErrorConstants";
import { showErrorDialog } from "../../../common/utilities/errorHandlerUtil";

export async function fetchDataFromDataverseAndUpdateVFS(
    portalFs: PortalsFS,
    defaultFileInfo?: IFileInfo,
) {
    try {
        // Clear webpage names tracking for fresh start
        WebExtensionContext.getWebpageNames().clear();

        const entityRequestURLs = getRequestUrlForEntities(defaultFileInfo?.entityId, defaultFileInfo?.entityName);
        const dataverseOrgUrl = WebExtensionContext.urlParametersMap.get(
            Constants.queryParameters.ORG_URL
        ) as string;
        await Promise.all(entityRequestURLs.map(async (entity) => {
            const startTime = new Date().getTime();
            await fetchFromDataverseAndCreateFiles(entity.entityName, entity.requestUrl, dataverseOrgUrl, portalFs, defaultFileInfo);

            if (defaultFileInfo === undefined) { // This will be undefined for bulk entity load
                WebExtensionContext.telemetry.sendInfoTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_FILES_LOAD_SUCCESS,
                    {
                        entityName: entity.entityName,
                        duration: (new Date().getTime() - startTime).toString(),
                    }
                );
            }
        }));
    } catch (error) {
        const errorMsg = (error as Error)?.message;
        showErrorDialog(
            vscode.l10n.t("There was a problem opening the workspace"),
            vscode.l10n.t(
                "We encountered an error preparing the files for edit."
            )
        );
        WebExtensionContext.telemetry.sendErrorTelemetry(webExtensionTelemetryEventNames.WEB_EXTENSION_FAILED_TO_PREPARE_WORKSPACE, fetchDataFromDataverseAndUpdateVFS.name, errorMsg, error as Error);
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
    let counter = 0;

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
                    ...getCommonHeadersForDataverse(
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
                console.error(vscode.l10n.t("Response data is empty"));
                throw new Error(ERROR_CONSTANTS.EMPTY_RESPONSE);
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
                for (; counter < data.length; counter++) {
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
            console.error(vscode.l10n.t("Failed to fetch some files."));
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
                    webExtensionTelemetryEventNames.WEB_EXTENSION_FETCH_DATAVERSE_AND_CREATE_FILES_SYSTEM_ERROR,
                    fetchFromDataverseAndCreateFiles.name,
                    (error as Error)?.message,
                    error as Error
                );
            }
        }
    }

    if (defaultFileInfo === undefined) {
        WebExtensionContext.telemetry.sendInfoTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_DATAVERSE_API_CALL_FILE_FETCH_COUNT,
            { entityName: entityName, count: data.length.toString() }
        );

        // Make sure the current active editor file is revealed in the explorer
        vscode.commands.executeCommand('workbench.files.action.showActiveFileInExplorer');
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
    let fileName = "";
    try {
        const entityDetails = getEntity(entityName);
        const attributes = entityDetails?.get(schemaEntityKey.ATTRIBUTES);
        const attributeExtension = entityDetails?.get(
            schemaEntityKey.ATTRIBUTES_EXTENSION
        );
        const mappingEntityFetchQuery = entityDetails?.get(
            schemaEntityKey.MAPPING_ENTITY_FETCH_QUERY
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
            throw new Error(ERROR_CONSTANTS.SUBURI_EMPTY);
        }

        if (!attributes || !attributeExtension) {
            throw new Error(ERROR_CONSTANTS.ATTRIBUTES_EMPTY);
        }

        const entityId = fetchedFileId ? result[fetchedFileId] : null;
        if (!entityId) {
            throw new Error(ERROR_CONSTANTS.FILE_ID_EMPTY);
        }

        fileName = fetchedFileName
            ? result[fetchedFileName]
            : Constants.EMPTY_FILE_NAME;

        if (fileName === Constants.EMPTY_FILE_NAME) {
            throw new Error(ERROR_CONSTANTS.FILE_NAME_EMPTY);
        }

        let folderName = fileName;
        if (entityName === schemaEntityName.WEBPAGES) {
            // Simple inline duplicate handling
            const webpageNames = WebExtensionContext.getWebpageNames();

            console.log(`Processing webpage: ${fileName}, entityId: ${entityId}, already exists: ${webpageNames.has(fileName)}`);

            if (webpageNames.has(fileName)) {
                // This is a duplicate - append entity ID
                folderName = getDuplicateFileName(fileName, entityId);
                console.log(`Created duplicate folder name: ${folderName}`);
            } else {
                // First occurrence - just track it
                webpageNames.add(fileName);
                console.log(`Added to tracking: ${fileName}`);
            }
        }

        // Create folder paths
        filePathInPortalFS = filePathInPortalFS ?? `${Constants.PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/`;
        if (exportType && exportType === folderExportType.SubFolders) {
            filePathInPortalFS = `${filePathInPortalFS}${getSanitizedFileName(folderName)}/`;
            await portalsFS.createDirectory(
                vscode.Uri.parse(filePathInPortalFS, true)
            );
        }

        const languageCodeAttribute = entityDetails?.get(
            schemaEntityKey.LANGUAGE_FIELD
        );

        let languageCode = WebExtensionContext.websiteLanguageCode;

        if (languageCodeAttribute && result[languageCodeAttribute] === null) {
            if (entityName !== schemaEntityName.CONTENTSNIPPETS) {
                throw new Error(ERROR_CONSTANTS.LANGUAGE_CODE_ID_VALUE_NULL);
            } else {
                languageCode = Constants.DEFAULT_LANGUAGE_CODE; // Handles the case where language code is null for content snippets
            }
        }

        if (defaultFileInfo?.fileName === undefined &&
            languageCodeAttribute &&
            result[languageCodeAttribute]) {
            const portalLanguageId =
                WebExtensionContext.websiteLanguageIdToPortalLanguageMap.get(
                    result[languageCodeAttribute]
                );

            languageCode = WebExtensionContext.portalLanguageIdCodeMap.get(
                portalLanguageId as string
            ) as string;

            if (languageCode === Constants.DEFAULT_LANGUAGE_CODE || languageCode === undefined) {
                throw new Error(ERROR_CONSTANTS.LANGUAGE_CODE_EMPTY);
            }
        }

        const attributeArray = attributes.split(",");

        // Get rootpage id Attribute
        const rootWebPageIdAttribute = entityDetails?.get(schemaEntityKey.ROOT_WEB_PAGE_ID);

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
            defaultFileInfo,
            rootWebPageIdAttribute)

    } catch (error) {
        const errorMsg = (error as Error)?.message;
        console.error(vscode.l10n.t("Failed to get file ready for edit: {0}", fileName));
        WebExtensionContext.telemetry.sendErrorTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_CONTENT_FILE_CREATION_FAILED,
            createContentFiles.name,
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
    rootWebPageIdAttribute?: string
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
        ) as string; // This will be undefined for Advanced forms where we need to further expand the data to look for steps information

        const attributePath: IAttributePath = getAttributePath(
            attributeArray[counter]
        );

        if (fileExtension === undefined) {
            const expandedContent = getAttributeContent(result, attributePath, entityName, entityId);

            if (!isNullOrUndefined(expandedContent)) {
                await processExpandedData(
                    entityName,
                    expandedContent,
                    portalsFS,
                    dataverseOrgUrl,
                    filePathInPortalFS);
            }
        }
        else {
            let fileCreationValid = true;
            let fileNameWithExtension = GetFileNameWithExtension(entityName, fileName, languageCode, fileExtension);

            if (defaultFileInfo?.fileName) {
                fileCreationValid = defaultFileInfo?.fileName === fileNameWithExtension ||
                    (defaultFileInfo?.fileName.startsWith(fileName) && defaultFileInfo?.fileName.endsWith(fileExtension));
                fileNameWithExtension = defaultFileInfo?.fileName;
            }

            // Get rootpage id
            let rootWebPageId = undefined;

            if (rootWebPageIdAttribute) {
                const rootWebPageIdPath: IAttributePath = getAttributePath(rootWebPageIdAttribute);
                rootWebPageId = getAttributeContent(result, rootWebPageIdPath, entityName, entityId);
            }

            if (fileCreationValid) {
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
                    portalsFS,
                    rootWebPageId,
                );
            }
        }
    }

    if (entityId === WebExtensionContext.defaultEntityId
        && defaultFileInfo !== undefined
        && defaultFileInfo.fileName === undefined) { // Triggered default file load defines this value

        const sourceAttribute = WebExtensionContext.urlParametersMap.get(Constants.queryParameters.SOURCE_ATTRIBUTE);
        let sourceAttributeExtension: string | undefined;

        if (sourceAttribute) {
            switch (sourceAttribute) {
                case Constants.sourceAttribute.CUSTOM_CSS:
                    sourceAttributeExtension = "customcss.css";
                    break;
                case Constants.sourceAttribute.CUSTOM_JAVASCRIPT:
                    sourceAttributeExtension = "customjs.js";
                    break;
                default:
                    WebExtensionContext.telemetry.sendErrorTelemetry(webExtensionTelemetryEventNames.WEB_EXTENSION_SOURCE_ATTRIBUTE_INVALID, processDataAndCreateFile.name);
                    sourceAttributeExtension = undefined;
            }
        }

        if (sourceAttributeExtension) {
            fileUri = filePathInPortalFS + GetFileNameWithExtension(entityName, fileName, languageCode, sourceAttributeExtension);
            await WebExtensionContext.updateSingleFileUrisInContext(
                vscode.Uri.parse(fileUri)
            );
        } else {
            await WebExtensionContext.updateSingleFileUrisInContext(
                vscode.Uri.parse(fileUri)
            );
        }
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
    portalsFS: PortalsFS,
    rootWebPageId?: string
) {
    const base64Encoded: boolean = isBase64Encoded(
        entityName,
        attribute
    );
    let fileContent = Constants.NO_CONTENT;
    let mimeType = undefined;
    let mappingEntityId = null
    // By default content is preloaded for all the files except for non-text webfiles for V2
    const isPreloadedContent = mappingEntityFetchQuery ? isWebfileContentLoadNeeded(fileNameWithExtension, fileUri) : true;

    // update func for webfiles for V2
    const attributePath: IAttributePath = getAttributePath(
        attribute
    );

    if (mappingEntityFetchQuery && isPreloadedContent) {
        const mappingContent = await fetchMappingEntityContent(
            mappingEntityFetchQuery,
            attribute,
            entityName,
            entityId,
            WebExtensionContext.dataverseAccessToken,
            dataverseOrgUrl
        );
        mappingEntityId = getMappingEntityId(entityName, mappingContent);
        mimeType = getMimeType(mappingContent);
        fileContent = getMappingEntityContent(entityName, mappingContent, attribute);
    } else {
        fileContent = getAttributeContent(result, attributePath, entityName, entityId);
    }

    const metadataKeys = getEntityParameters(entityName);
    const entityMetadata = getMetadataInfo(result, metadataKeys.filter(key => key !== undefined) as string[]);

    await createVirtualFile(
        portalsFS,
        fileUri,
        convertContentToUint8Array(fileContent ?? Constants.NO_CONTENT, base64Encoded),
        entityId,
        attributePath,
        encodeAsBase64(entityName, attribute),
        entityName,
        fileNameWithExtension,
        result[attributePath.source] ?? Constants.NO_CONTENT,
        fileExtension,
        result[Constants.ODATA_ETAG],
        mimeType ?? result[Constants.MIMETYPE],
        isPreloadedContent,
        mappingEntityId,
        entityMetadata,
        rootWebPageId,
    );
}

async function fetchMappingEntityContent(
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
        mappingEntityFetchQueryMap?.get(attributeKey) as string,
        getEntity(entity)?.get(schemaEntityKey.MAPPING_ENTITY)
    );

    WebExtensionContext.telemetry.sendAPITelemetry(
        requestUrl,
        entity,
        Constants.httpMethod.GET,
        fetchMappingEntityContent.name
    );
    requestSentAtTime = new Date().getTime();

    const response = await WebExtensionContext.concurrencyHandler.handleRequest(requestUrl, {
        headers: getCommonHeadersForDataverse(accessToken),
    });

    if (!response.ok) {
        WebExtensionContext.telemetry.sendAPIFailureTelemetry(
            requestUrl,
            entity,
            Constants.httpMethod.GET,
            new Date().getTime() - requestSentAtTime,
            fetchMappingEntityContent.name,
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
        fetchMappingEntityContent.name
    );

    const result = await response.json();
    const data = result.value ?? result;
    if (isPortalVersionV1() && result[Constants.ODATA_COUNT] > 0 && data.length > 0) {
        return data[0];
    }

    return isPortalVersionV2() ? data : Constants.NO_CONTENT;
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

        if (entityType === schemaEntityName.ADVANCEDFORMS &&
            schema.toLowerCase() === portal_schema_V2.entities.dataSourceProperties.schema) {
            entityType = schemaEntityName.ADVANCEDFORMSTEPS;
            const dataverseOrgUrl = WebExtensionContext.urlParametersMap.get(
                Constants.queryParameters.ORG_URL
            ) as string;
            const entityDetails = getEntity(entityType);
            const fetchedFileId = entityDetails?.get(schemaEntityKey.FILE_ID_FIELD);
            const formsData = await fetchFromDataverseAndCreateFiles(entityType, getCustomRequestURL(dataverseOrgUrl, entityType));
            const attributePath: IAttributePath = getAttributePath(
                EntityMetadataKeyCore.WEBFORM_STEPS
            );

            const advancedFormStepData = new Map();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formsData?.forEach((dataItem: any) => {
                const entityId = fetchedFileId ? dataItem[fetchedFileId] : null;
                if (!entityId) {
                    throw new Error(ERROR_CONSTANTS.FILE_ID_EMPTY);
                }
                advancedFormStepData.set(entityId, dataItem);
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data?.forEach((dataItem: any) => {
                try {
                    const webFormSteps = getAttributeContent(dataItem, attributePath, entityType, fetchedFileId as string) as [];

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const steps: any[] = [];

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    !isNullOrUndefined(webFormSteps) && webFormSteps?.forEach((step: any) => {
                        const formStepData = advancedFormStepData.get(step);

                        if (formStepData) {
                            steps.push(formStepData);
                        }
                    });
                    setFileContent(dataItem, attributePath, steps);
                }
                catch (error) {
                    const errorMsg = (error as Error)?.message;
                    WebExtensionContext.telemetry.sendErrorTelemetry(webExtensionTelemetryEventNames.WEB_EXTENSION_PREPROCESS_DATA_WEBFORM_STEPS_FAILED,
                        preprocessData.name,
                        errorMsg);
                }
            });
            WebExtensionContext.telemetry.sendInfoTelemetry(webExtensionTelemetryEventNames.WEB_EXTENSION_PREPROCESS_DATA_SUCCESS, { entityType: entityType });
        }
    }
    catch (error) {
        const errorMsg = (error as Error)?.message;
        WebExtensionContext.telemetry.sendErrorTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_PREPROCESS_DATA_FAILED,
            preprocessData.name,
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
    isPreloadedContent?: boolean,
    mappingEntityId?: string,
    entityMetadata?: SchemaEntityMetadata,
    rootWebPageId?: string,
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
        isPreloadedContent,
        entityMetadata
    );

    // Call file system provider write call for buffering file data in VFS
    await portalsFS.writeFile(
        vscode.Uri.parse(fileUri),
        fileContent,
        { create: true, overwrite: true },
        true
    );

    // Maintain entity details in context
    await WebExtensionContext.updateEntityDetailsInContext(
        entityId,
        entityName,
        odataEtag,
        attributePath,
        originalAttributeContent,
        mappingEntityId,
        fileUri,
        rootWebPageId,
    );

    // Maintain foreign key details in context
    if (rootWebPageId) {
        try {
            await WebExtensionContext.updateForeignKeyDetailsInContext(
                rootWebPageId,
                entityId,
            );
        } catch (error) {
            const errorMsg = (error as Error)?.message;
            WebExtensionContext.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_FAILED_TO_UPDATE_FOREIGN_KEY_DETAILS,
                createVirtualFile.name,
                errorMsg,
                error as Error
            );
        }
    }
}
