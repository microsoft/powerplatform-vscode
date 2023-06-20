/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import fetch from "node-fetch";
import {
    convertfromBase64ToString,
    GetFileContent,
    GetFileNameWithExtension,
} from "../utilities/commonUtil";
import { getRequestURL, updateEntityId } from "../utilities/urlBuilderUtil";
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
import { folderExportType, schemaEntityKey } from "../schema/constants";
import { getEntityNameForExpandedEntityContent, getRequestUrlForEntities } from "../utilities/folderHelperUtility";
import { IAttributePath } from "../common/interfaces";

export async function fetchDataFromDataverseAndUpdateVFS(
    portalFs: PortalsFS,
    entityId = "",
    entityType = ""
) {
    const entityRequestURLs = getRequestUrlForEntities(entityId, entityType);
    const dataverseOrgUrl = WebExtensionContext.urlParametersMap.get(
        Constants.queryParameters.ORG_URL
    ) as string;

    await Promise.all(entityRequestURLs.map(async (entity) => {
        let requestSentAtTime = new Date().getTime();
        try {
            let makeRequestCall = true;
            while (makeRequestCall) {
                WebExtensionContext.telemetry.sendAPITelemetry(
                    entity.requestUrl,
                    entity.entityName,
                    Constants.httpMethod.GET
                );

                requestSentAtTime = new Date().getTime();
                const response = await fetch(entity.requestUrl, {
                    headers: {
                        ...getCommonHeaders(
                            WebExtensionContext.dataverseAccessToken
                        ),
                        Prefer: `odata.maxpagesize=${Constants.MAX_ENTITY_FETCH_COUNT}, odata.include-annotations="Microsoft.Dynamics.CRM.*"`,
                    },
                });

                if (!response.ok) {
                    makeRequestCall = false;
                    vscode.window.showErrorMessage(
                        vscode.l10n.t("Failed to fetch file content.")
                    );
                    WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                        entity.requestUrl,
                        entity.entityName,
                        Constants.httpMethod.GET,
                        new Date().getTime() - requestSentAtTime,
                        JSON.stringify(response)
                    );
                    throw new Error(response.statusText);
                }

                WebExtensionContext.telemetry.sendAPISuccessTelemetry(
                    entity.requestUrl,
                    entity.entityName,
                    Constants.httpMethod.GET,
                    new Date().getTime() - requestSentAtTime
                );

                const result = await response.json();
                const data = result.value;
                if (result[Constants.ODATA_NEXT_LINK]) {
                    makeRequestCall = true;
                    entity.requestUrl = result[Constants.ODATA_NEXT_LINK];
                } else {
                    makeRequestCall = false;
                }

                if (!data) {
                    vscode.window.showErrorMessage(
                        "microsoft-powerapps-portals.webExtension.fetch.nocontent.error",
                        "Response data is empty"
                    );
                    throw new Error(ERRORS.EMPTY_RESPONSE);
                }

                for (let counter = 0; counter < data.length; counter++) {
                    await createContentFiles(
                        data[counter],
                        entity.entityName,
                        portalFs,
                        dataverseOrgUrl
                    );
                }
            }
        } catch (error) {
            const errorMsg = (error as Error)?.message;
            showErrorDialog(
                vscode.l10n.t("There was a problem opening the workspace"),
                vscode.l10n.t(
                    "We encountered an error preparing the file for edit."
                )
            );
            WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                entity.requestUrl,
                entity.entityName,
                Constants.httpMethod.GET,
                new Date().getTime() - requestSentAtTime,
                errorMsg
            );
        }
    }));
}

async function createContentFiles(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any,
    entityName: string,
    portalsFS: PortalsFS,
    dataverseOrgUrl: string,
    filePathInPortalFS?: string
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
            filePathInPortalFS = `${filePathInPortalFS}/${fileName}/`;
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

        if (languageCodeAttribute && result[languageCodeAttribute]) {
            const portalLanguageId =
                WebExtensionContext.websiteLanguageIdToPortalLanguageMap.get(
                    result[languageCodeAttribute]
                );

            languageCode = WebExtensionContext.portalLanguageIdCodeMap.get(
                portalLanguageId as string
            ) as string;
        }

        if (languageCode === Constants.DEFAULT_LANGUAGE_CODE) {
            throw new Error(ERRORS.LANGUAGE_CODE_EMPTY);
        }

        WebExtensionContext.telemetry.sendInfoTelemetry(
            telemetryEventNames.WEB_EXTENSION_EDIT_LANGUAGE_CODE,
            { languageCode: languageCode.toString() }
        );         
        
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
            portalsFS)

    } catch (error) {
        const errorMsg = (error as Error)?.message;
        console.error(errorMsg);
        vscode.window.showErrorMessage(
            vscode.l10n.t("Failed to get file ready for edit.")
        );
        WebExtensionContext.telemetry.sendErrorTelemetry(
            telemetryEventNames.WEB_EXTENSION_CONTENT_FILE_CREATION_FAILED,
            errorMsg
        );
    }
}

async function processDataAndCreateFile(
    attributeArray: string[],
    attributeExtension: string,
    entityName: string,
    result: any,
    mappingEntityFetchQuery: string | undefined,
    entityId: string,
    dataverseOrgUrl: string,
    fileName: string,
    languageCode: string,
    filePathInPortalFS: string,
    portalsFS: PortalsFS,
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
        const fileNameWithExtension = GetFileNameWithExtension(
            entityName,
            fileName,
            languageCode,
            fileExtension
        );

        if(result[attributeArray[counter]] && fileExtension === undefined){
            await processExpandedData(
                 entityName,
                 result[attributeArray[counter]],
                 portalsFS,
                 dataverseOrgUrl,
                 filePathInPortalFS);
        }
        else 
        {
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

    await openDefaultEntityFile(entityId, fileUri);
}

async function processExpandedData(
    entityName: string,
    result: any,
    portalFs: PortalsFS,
    dataverseOrgUrl: string,
    filePathInPortalFS: string
){
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
    result: any,
    mappingEntityFetchQuery: string | undefined,
    entityId: string,
    dataverseOrgUrl: string,
    portalsFS: PortalsFS,
){
    const base64Encoded: boolean = isBase64Encoded(
        entityName,
        attribute
    ); // update func for webfiles for V2
    const attributePath: IAttributePath = getAttributePath(
        attribute
    );

    let fileContent = GetFileContent(result, attributePath);
    if (mappingEntityFetchQuery) {
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
        base64Encoded
            ? convertfromBase64ToString(fileContent)
            : fileContent,
        updateEntityId(entityName, entityId, result),
        attributePath,
        encodeAsBase64(entityName, attribute),
        entityName,
        fileNameWithExtension,
        result[attributePath.source] ?? Constants.NO_CONTENT,
        fileExtension,
        result[Constants.ODATA_ETAG],
        result[Constants.MIMETYPE]
    );
}

async function openDefaultEntityFile(entityId: string, fileUri: string){
    if (entityId === WebExtensionContext.defaultEntityId) {
        await WebExtensionContext.updateSingleFileUrisInContext(
            vscode.Uri.parse(fileUri)
        );

        // Not awaited intentionally - fire and forget
        vscode.commands.executeCommand(
            "vscode.open",
            vscode.Uri.parse(fileUri),
            { background: true, preview: false }
        );
        WebExtensionContext.telemetry.sendInfoTelemetry(
            telemetryEventNames.WEB_EXTENSION_VSCODE_START_COMMAND,
            { commandId: "vscode.open", type: "file" }
        );
    }
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
        Constants.httpMethod.GET
    );
    requestSentAtTime = new Date().getTime();

    const response = await fetch(requestUrl, {
        headers: getCommonHeaders(accessToken),
    });

    if (!response.ok) {
        WebExtensionContext.telemetry.sendAPIFailureTelemetry(
            requestUrl,
            entity,
            Constants.httpMethod.GET,
            new Date().getTime() - requestSentAtTime,
            JSON.stringify(response)
        );
        throw new Error(response.statusText);
    }

    WebExtensionContext.telemetry.sendAPISuccessTelemetry(
        requestUrl,
        entity,
        Constants.httpMethod.GET,
        new Date().getTime() - requestSentAtTime
    );

    const result = await response.json();
    return result.value ?? Constants.NO_CONTENT;
}

async function createVirtualFile(
    portalsFS: PortalsFS,
    fileUri: string,
    fileContent: string | undefined,
    entityId: string,
    attributePath: IAttributePath,
    encodeAsBase64: boolean,
    entityName: string,
    fileName: string,
    originalAttributeContent: string,
    fileExtension: string,
    odataEtag: string,
    mimeType?: string
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
        mimeType
    );

    // Call file system provider write call for buffering file data in VFS
    await portalsFS.writeFile(
        vscode.Uri.parse(fileUri),
        new TextEncoder().encode(fileContent),
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
