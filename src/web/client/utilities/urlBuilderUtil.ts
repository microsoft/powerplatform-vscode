/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { httpMethod } from "../common/constants";
import WebExtensionContext from "../WebExtensionContext";
import {
    entityAttributesWithBase64Encoding,
    schemaEntityKey,
    schemaEntityName,
    schemaKey,
} from "../schema/constants";
import { getEntity } from "./schemaHelperUtil";

export const getParameterizedRequestUrlTemplate = (isSingleEntity: boolean) => {
    if (isSingleEntity) {
        return WebExtensionContext.schemaDataSourcePropertiesMap.get(
            schemaKey.SINGLE_ENTITY_URL
        ) as string;
    }

    return WebExtensionContext.schemaDataSourcePropertiesMap.get(
        schemaKey.MULTI_ENTITY_URL
    ) as string;
};

export function getRequestURL(
    dataverseOrgUrl: string,
    entity: string,
    entityId: string,
    method: string,
    isSingleEntity: boolean,
    attributeQueryParameters?: string
): string {
    let parameterizedUrlTemplate =
        getParameterizedRequestUrlTemplate(isSingleEntity);

    switch (method) {
        case httpMethod.GET:
            parameterizedUrlTemplate =
                parameterizedUrlTemplate +
                (attributeQueryParameters ??
                    getEntity(entity)?.get(
                        schemaEntityKey.FETCH_QUERY_PARAMETERS
                    ));
            break;
        default:
            break;
    }

    return parameterizedUrlTemplate
        .replace("{dataverseOrgUrl}", dataverseOrgUrl)
        .replace(
            "{entity}",
            getEntity(entity)?.get(
                schemaEntityKey.DATAVERSE_ENTITY_NAME
            ) as string
        )
        .replace("{entityId}", entityId)
        .replace(
            "{api}",
            WebExtensionContext.schemaDataSourcePropertiesMap.get(
                schemaKey.API
            ) as string
        )
        .replace(
            "{data}",
            WebExtensionContext.schemaDataSourcePropertiesMap.get(
                schemaKey.DATA
            ) as string
        )
        .replace(
            "{version}",
            WebExtensionContext.schemaDataSourcePropertiesMap.get(
                schemaKey.DATAVERSE_API_VERSION
            ) as string
        );
}

export function getCustomRequestURL(
    dataverseOrgUrl: string,
    entity: string,
    urlQueryKey: string = schemaKey.MULTI_ENTITY_URL
): string {
    const parameterizedUrl =
        WebExtensionContext.schemaDataSourcePropertiesMap.get(
            urlQueryKey
        ) as string;
    const fetchQueryParameters = getEntity(entity)?.get(
        "_fetchQueryParameters"
    );
    const requestUrl = parameterizedUrl
        .replace("{dataverseOrgUrl}", dataverseOrgUrl)
        .replace(
            "{entity}",
            getEntity(entity)?.get(
                schemaEntityKey.DATAVERSE_ENTITY_NAME
            ) as string
        )
        .replace(
            "{api}",
            WebExtensionContext.schemaDataSourcePropertiesMap.get(
                schemaKey.API
            ) as string
        )
        .replace(
            "{data}",
            WebExtensionContext.schemaDataSourcePropertiesMap.get(
                schemaKey.DATA
            ) as string
        )
        .replace(
            "{version}",
            WebExtensionContext.schemaDataSourcePropertiesMap.get(
                schemaKey.DATAVERSE_API_VERSION
            ) as string
        );

    return requestUrl + fetchQueryParameters;
}

export function getPatchRequestUrl(
    entity: string,
    attributeType: string,
    requestUrl: string
) {
    return entity === schemaEntityName.WEBFILES &&
        attributeType === entityAttributesWithBase64Encoding.filecontent
        ? requestUrl + "/" + attributeType
        : requestUrl;
}

// this function removes hostName from the url
export function sanitizeURL(url: string): string {
    let sanitizedUrl = "";
    try {
        const completeUrl = new URL(url);
        const hostName = completeUrl.hostname;
        sanitizedUrl = url.replace(hostName, "[redact]");
    } catch (error) {
        return "";
    }
    return sanitizedUrl;
}

// TODO - Make Json for different response type and update any here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateEntityId(entity: string, entityId: string, result: any) {
    const mappedEntityId = getEntity(entity)?.get(
        schemaEntityKey.MAPPING_ENTITY_ID
    );

    if (mappedEntityId) {
        return result[mappedEntityId];
    }

    return entityId;
}

export function pathHasEntityFolderName(uri: string): boolean {
    for (const entry of WebExtensionContext.entitiesFolderNameMap.entries()) {
        if (uri.includes(entry[1])) {
            return true;
        }
    }

    return false;
}

export async function getOrCreateSharedWorkspace(config: any) {
    const getWorkspaceResponse = await fetch(
        `${
            config.dataverseOrgUrl
        }/api/data/v9.2/sharedworkspaces?$filter=name eq '${
            "Site-" + config.websiteid
        }'`,
        {
            headers: config.headers,
            method: "GET",
        }
    );
    const getWorkspaceResult = await getWorkspaceResponse.json();
    if (getWorkspaceResult.value.length) {
        console.log(`FETCHED EXISTING SHAREDWORKSPACE`);

        return getWorkspaceResult.value[0];
    }

    console.log(`CREATING NEW SHAREDWORKSPACE`);
    const createWorkspaceResponse = await fetch(
        `${config.dataverseOrgUrl}/api/data/v9.2/sharedworkspaces`,
        {
            headers: {
                ...config.headers,
                Prefer: "return=representation",
            },
            method: "POST",
            body: JSON.stringify({
                name: "Site-" + config.websiteid,
                sharedworkspaceid: "00218f43-15d4-f87e-0e08-5dec2c4cfbaa",
            }),
        }
    );

    return await createWorkspaceResponse.json();
}
