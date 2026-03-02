/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import sinon from "sinon";
import {
    getParameterizedRequestUrlTemplate,
    sanitizeURL,
    pathHasEntityFolderName,
    getRequestURL,
    getCustomRequestURL,
    getPatchRequestUrl,
    getMappingEntityId,
} from "../../utilities/urlBuilderUtil";
import { expect } from "chai";
import {
    schemaKey,
    schemaEntityKey,
    schemaEntityName,
    entityAttributesWithBase64Encoding,
} from "../../schema/constants";
import { httpMethod } from "../../common/constants";
import * as schemaHelper from "../../utilities/schemaHelperUtil";
import * as portalSchemaReader from "../../schema/portalSchemaReader";
import WebExtensionContext, {
    IWebExtensionContext,
} from "../../WebExtensionContext";

describe("URLBuilder", () => {
    afterEach(() => {
        sinon.restore();
    });

    it("getParameterizedRequestUrlTemplate_should_return_SINGLE_ENTITY_URL_KEY_when_isSingleEntity_is_true", async () => {
        sinon
            .stub(portalSchemaReader, "getDataSourcePropertiesMap")
            .returns(
                new Map<string, string>([
                    [schemaKey.SINGLE_ENTITY_URL, schemaKey.SINGLE_ENTITY_URL],
                ])
            );

        sinon
            .stub(portalSchemaReader, "getEntitiesSchemaMap")
            .returns(new Map());
        WebExtensionContext.setWebExtensionContext("", "", new Map());

        const isSingleEntity = true;
        const result: string =
            getParameterizedRequestUrlTemplate(isSingleEntity);
        expect(result).eq("singleEntityURL");
    });

    it("getParameterizedRequestUrlTemplate_should_return_SINGLE_ENTITY_URL_KEY_when_isSingleEntity_is_false", async () => {
        sinon
            .stub(portalSchemaReader, "getDataSourcePropertiesMap")
            .returns(
                new Map<string, string>([
                    [schemaKey.MULTI_ENTITY_URL, schemaKey.MULTI_ENTITY_URL],
                ])
            );

        sinon
            .stub(portalSchemaReader, "getEntitiesSchemaMap")
            .returns(new Map());
        WebExtensionContext.setWebExtensionContext("", "", new Map());
        const result = getParameterizedRequestUrlTemplate(false);
        expect(result).eq(schemaKey.MULTI_ENTITY_URL);
    });

    it("sanitizeURL", () => {
        const url = "https://make.powerpages.microsoft.com/";
        const result = sanitizeURL(url);
        const completeUrl = new URL(url);
        const hostName = completeUrl.hostname;
        const sanitizedUrl = url.replace(hostName, "[redact]");
        expect(result).eq(sanitizedUrl);
    });

    it("sanitizeURL_shoud_return_blank_if_url_is_not_valid", () => {
        const url = "microsoft.com/";
        const result = sanitizeURL(url);
        expect(result).to.be.empty;
    });

    it("getMappingEntityId_should_return_mappingEntityid_when_entity_is_not_found", async () => {
        const entity = "entity";
        sinon
            .stub(schemaHelper, "getEntity")
            .returns(
                new Map<string, string>([
                    [schemaEntityKey.ATTRIBUTES_EXTENSION, "MAPPING_ENTITY_ID"],
                ])
            );

        const result = "ff";
        const res = getMappingEntityId(entity, result);
        expect(res).null;
    });

    it("getMappingEntityId_should_return_mappingEntityid_when_entity_is_found", async () => {
        const entity = "webpages";
        sinon
            .stub(schemaHelper, "getEntity")
            .returns(
                new Map<string, string>([
                    [schemaEntityKey.MAPPING_ENTITY_ID, "MAPPING_ENTITY_ID"],
                ])
            );
        const result = { MAPPING_ENTITY_ID: "1" };
        const res = getMappingEntityId(entity, result);
        expect(res).eq("1");
    });

    it("pathHasEntityFolderName_should_return_true", async () => {
        const entitiesSchemaMap = new Map<string, Map<string, string>>();
        entitiesSchemaMap.set(
            "adx_webpages",
            new Map<string, string>([
                [schemaKey.MULTI_ENTITY_URL, schemaKey.MULTI_ENTITY_URL],
            ])
        );

        sinon
            .stub(portalSchemaReader, "getEntitiesFolderNameMap")
            .returns(
                new Map<string, string>([
                    ["make.powerpages.com", "make.powerpages.com"],
                ])
            );

        sinon
            .stub(portalSchemaReader, "getDataSourcePropertiesMap")
            .returns(
                new Map<string, string>([
                    [schemaKey.SINGLE_ENTITY_URL, schemaKey.SINGLE_ENTITY_URL],
                ])
            );
        sinon
            .stub(portalSchemaReader, "getEntitiesSchemaMap")
            .returns(new Map());
        WebExtensionContext.setWebExtensionContext("", "", new Map());

        const uriName = "make.powerpages.com";
        const res = pathHasEntityFolderName(uriName);
        expect(res).true;
    });

    it("pathHasEntityFolderName_should_return_false", async () => {
        sinon
            .stub(portalSchemaReader, "getEntitiesFolderNameMap")
            .returns(new Map());

        sinon
            .stub(portalSchemaReader, "getDataSourcePropertiesMap")
            .returns(
                new Map<string, string>([
                    [schemaKey.SINGLE_ENTITY_URL, schemaKey.SINGLE_ENTITY_URL],
                ])
            );
        sinon
            .stub(portalSchemaReader, "getEntitiesSchemaMap")
            .returns(new Map());
        WebExtensionContext.setWebExtensionContext("", "", new Map());

        const uriName = "make.powerpages.com";
        const res = pathHasEntityFolderName(uriName);
        expect(res).false;
    });

    it("getRequestURL_with_get_http_method", () => {
        const webExtensionContext: IWebExtensionContext = {
            schemaDataSourcePropertiesMap: new Map<string, string>([
                [schemaKey.API, "schemaKey.API"],
                [
                    schemaKey.SINGLE_ENTITY_URL,
                    "{dataverseOrgUrl} {entity} {entityId} {api} {data} {version}",
                ],
                [schemaKey.DATA, "schemaKey.DATA"],
                [schemaKey.DATAVERSE_API_VERSION, "1.0"],
                ["api", "api"],
                ["data", "data"],
                ["version", "1.0"],
            ]),
        } as IWebExtensionContext;

        sinon.stub(schemaHelper, "getEntity").returns(
            new Map<string, string>([
                [
                    schemaEntityKey.FETCH_QUERY_PARAMETERS,
                    "FETCH_QUERY_PARAMETERS",
                ],
                [
                    schemaEntityKey.DATAVERSE_ENTITY_NAME,
                    "DATAVERSE_ENTITY_NAME",
                ],
            ])
        );

        sinon
            .stub(WebExtensionContext, "schemaDataSourcePropertiesMap")
            .returns(webExtensionContext);

        const dataverseOrgUrl = "dataverseOrgUrl";
        const entity = "WEBPAGES";
        const entityId = "id";
        const method = httpMethod.GET;
        const isSingleEntity = true;
        const result = getRequestURL(
            dataverseOrgUrl,
            entity,
            entityId,
            method,
            isSingleEntity,
            false
        );

        const expResult = "singleEntityURL";
        expect(result).eq(expResult);
    });

    it("getRequestURL_with_patch_http_method", () => {
        sinon.stub(portalSchemaReader, "getDataSourcePropertiesMap").returns(
            new Map<string, string>([
                [
                    schemaKey.SINGLE_ENTITY_URL,
                    "{dataverseOrgUrl} {entity} {entityId} {api} {data} {version}",
                ],
                [schemaKey.DATA, "api"],
                [schemaKey.API, "data"],
                [schemaKey.DATAVERSE_API_VERSION, "1.0"],
            ])
        );

        sinon
            .stub(portalSchemaReader, "getEntitiesSchemaMap")
            .returns(new Map());
        WebExtensionContext.setWebExtensionContext("", "", new Map());

        const webExtensionContext: IWebExtensionContext = {
            schemaDataSourcePropertiesMap: new Map<string, string>([
                [schemaKey.API, "schemaKey.API"],
                [
                    schemaKey.SINGLE_ENTITY_URL,
                    "{dataverseOrgUrl} {entity} {entityId} {api} {data} {version}",
                ],
                [schemaKey.DATA, "schemaKey.DATA"],
                [schemaKey.DATAVERSE_API_VERSION, "1.0"],
                ["api", "api"],
                ["data", "data"],
                ["version", "1.0"],
            ]),
        } as IWebExtensionContext;
        sinon
            .stub(WebExtensionContext, "schemaDataSourcePropertiesMap")
            .returns(webExtensionContext);

        sinon.stub(schemaHelper, "getEntity").returns(
            new Map<string, string>([
                [
                    schemaEntityKey.FETCH_QUERY_PARAMETERS,
                    "FETCH_QUERY_PARAMETERS",
                ],
                [
                    schemaEntityKey.DATAVERSE_ENTITY_NAME,
                    "DATAVERSE_ENTITY_NAME",
                ],
            ])
        );

        const dataverseOrgUrl = "dataverseOrgUrl";
        const entity = "WEBPAGES";
        const entityId = "id";
        const method = httpMethod.PATCH;
        const isSingleEntity = true;
        const result = getRequestURL(
            dataverseOrgUrl,
            entity,
            entityId,
            method,
            isSingleEntity,
            false
        );

        const expResult = `dataverseOrgUrl DATAVERSE_ENTITY_NAME id data api 1.0`;
        expect(result).eq(expResult);
    });

    it("getCustomRequestURL", () => {
        const mock = new Map<string, string>([
            [schemaEntityKey.MULTI_FILE_FETCH_QUERY_PARAMETERS, "_fetchQueryParameters"],
            [schemaEntityKey.DATAVERSE_ENTITY_NAME, "DATAVERSE_ENTITY_NAME"],
            [schemaKey.DATA, "schemaKey.DATA"],
            [schemaKey.DATAVERSE_API_VERSION, "1.0"],
        ]);

        sinon.stub(portalSchemaReader, "getDataSourcePropertiesMap").returns(
            new Map<string, string>([
                [
                    schemaKey.MULTI_ENTITY_URL,
                    "{dataverseOrgUrl} {entity} {api} {data} {version}",
                ],
                [schemaKey.API, "api"],
                [schemaKey.DATA, "data"],
                [schemaKey.DATAVERSE_API_VERSION, "1.0"],
            ])
        );
        sinon
            .stub(portalSchemaReader, "getEntitiesSchemaMap")
            .returns(
                new Map<string, Map<string, string>>([["WEBPAGES", mock]])
            );
        WebExtensionContext.setWebExtensionContext("", "", new Map());

        const dataverseOrgUrl = "dataverseOrgUrl";
        const entity = "WEBPAGES";
        const result = getCustomRequestURL(dataverseOrgUrl, entity);

        const expResult = `dataverseOrgUrl DATAVERSE_ENTITY_NAME api data 1.0_fetchQueryParameters`;
        expect(result).eq(expResult);
    });

    it("getPatchRequestUrl should return / if condtion match", () => {
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        const requestUrl = "microsoft.com";
        const result = getPatchRequestUrl(entity, attributeType, requestUrl);
        expect(result).eq(requestUrl + "/" + attributeType);
    });

    it("getPatchRequestUrl should / if attributeType is documentbody", () => {
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        const requestUrl = "microsoft.com";
        const result = getPatchRequestUrl(entity, attributeType, requestUrl);
        expect(result).eq(requestUrl);
    });

    it("getPatchRequestUrl should / if entity is not WEBFILES", () => {
        const entity = schemaEntityName.CONTENTSNIPPETS;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        const requestUrl = "microsoft.com";
        const result = getPatchRequestUrl(entity, attributeType, requestUrl);
        expect(result).eq(requestUrl);
    });
});
