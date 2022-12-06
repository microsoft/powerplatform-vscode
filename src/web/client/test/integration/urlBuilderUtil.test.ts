/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import sinon from "sinon";
import {
    getParameterizedRequestUrlTemplate,
    sanitizeURL,
    updateEntityId,
    pathHasEntityFolderName,
    getRequestURL,
    getCustomRequestURL,
    getPatchRequestUrl,
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

import PowerPlatformExtensionContextManager, {
    IPowerPlatformExtensionContext,
} from "../../powerPlatformExtensionContext";
describe("URLBuilder", () => {
    afterEach(() => {
        sinon.restore();
    });

    it("getParameterizedRequestUrlTemplate_should_return_SINGLE_ENTITY_URL_KEY_when_isSingleEntity_is_true", async () => {
        const powerPlatformExtensionContext: IPowerPlatformExtensionContext = {
            dataSourcePropertiesMap: new Map<string, string>([
                [schemaKey.SINGLE_ENTITY_URL, schemaKey.SINGLE_ENTITY_URL],
            ]),
        } as IPowerPlatformExtensionContext;
        sinon
            .stub(
                PowerPlatformExtensionContextManager,
                "getPowerPlatformExtensionContext"
            )
            .returns(powerPlatformExtensionContext);
        const isSingleEntity = true;
        const result = getParameterizedRequestUrlTemplate(isSingleEntity);
        expect(result).eq("singleEntityURL");
    });

    it("getParameterizedRequestUrlTemplate_should_return_SINGLE_ENTITY_URL_KEY_when_isSingleEntity_is_false", async () => {
        const powerPlatformExtensionContext: IPowerPlatformExtensionContext = {
            dataSourcePropertiesMap: new Map<string, string>([
                [schemaKey.MULTI_ENTITY_URL, schemaKey.MULTI_ENTITY_URL],
            ]),
        } as IPowerPlatformExtensionContext;
        sinon
            .stub(
                PowerPlatformExtensionContextManager,
                "getPowerPlatformExtensionContext"
            )
            .returns(powerPlatformExtensionContext);
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

    it("updateEntityId_should_return_entityid_when_entity_is_not_found", async () => {
        sinon
            .stub(schemaHelper, "getEntity")
            .returns(
                new Map<string, string>([
                    [schemaEntityKey.ATTRIBUTES_EXTENSION, "MAPPING_ENTITY_ID"],
                ])
            );

        const entity = "entity";
        const entityId = "1";
        const result = "ff";
        const res = updateEntityId(entity, entityId, result);
        expect(res).eq(entityId);
    });

    it("updateEntityId_should_return_entityid_when_entity_is_found", async () => {
        sinon
            .stub(schemaHelper, "getEntity")
            .returns(
                new Map<string, string>([
                    [schemaEntityKey.MAPPING_ENTITY_ID, "MAPPING_ENTITY_ID"],
                ])
            );

        const entity = "webpages";
        const entityId = "1";
        const result = { MAPPING_ENTITY_ID: "MAPPING_ENTITY_ID" };
        const res = updateEntityId(entity, entityId, result);
        expect(res).eq("MAPPING_ENTITY_ID");
    });

    it("pathHasEntityFolderName_should_return_true", async () => {
        const entitiesSchemaMap = new Map<string, Map<string, string>>();
        entitiesSchemaMap.set(
            "adx_webpages",
            new Map<string, string>([
                [schemaKey.MULTI_ENTITY_URL, schemaKey.MULTI_ENTITY_URL],
            ])
        );
        const powerPlatformExtensionContext: IPowerPlatformExtensionContext = {
            entitiesFolderNameMap: new Map<string, string>([
                ["make.powerpages.com", "make.powerpages.com"],
            ]),
        } as IPowerPlatformExtensionContext;

        sinon
            .stub(
                PowerPlatformExtensionContextManager,
                "getPowerPlatformExtensionContext"
            )
            .returns(powerPlatformExtensionContext);

        const uriName = "make.powerpages.com";
        const res = pathHasEntityFolderName(uriName);
        expect(res).true;
    });

    it("pathHasEntityFolderName_should_return_false", async () => {
        const entitiesSchemaMap = new Map<string, Map<string, string>>();
        entitiesSchemaMap.set(
            "adx_webpages",
            new Map<string, string>([
                [schemaKey.MULTI_ENTITY_URL, schemaKey.MULTI_ENTITY_URL],
            ])
        );
        const powerPlatformExtensionContext: IPowerPlatformExtensionContext = {
            entitiesFolderNameMap: new Map<string, string>([["123", "123"]]),
        } as IPowerPlatformExtensionContext;

        sinon
            .stub(
                PowerPlatformExtensionContextManager,
                "getPowerPlatformExtensionContext"
            )
            .returns(powerPlatformExtensionContext);

        const uriName = "make.powerpages.com";
        const res = pathHasEntityFolderName(uriName);
        expect(res).false;
    });

    it("getRequestURL_with_get_http_method", () => {
        const powerPlatformExtensionContext: IPowerPlatformExtensionContext = {
            dataSourcePropertiesMap: new Map<string, string>([
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
        } as IPowerPlatformExtensionContext;

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
            .stub(
                PowerPlatformExtensionContextManager,
                "getPowerPlatformExtensionContext"
            )
            .returns(powerPlatformExtensionContext);

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
            isSingleEntity
        );

        const expResult =
            "dataverseOrgUrl DATAVERSE_ENTITY_NAME id api data 1.0FETCH_QUERY_PARAMETERS";
        expect(result).eq(expResult);
    });

    it("getRequestURL_with_patch_http_method", () => {
        const powerPlatformExtensionContext: IPowerPlatformExtensionContext = {
            dataSourcePropertiesMap: new Map<string, string>([
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
        } as IPowerPlatformExtensionContext;
        sinon
            .stub(
                PowerPlatformExtensionContextManager,
                "getPowerPlatformExtensionContext"
            )
            .returns(powerPlatformExtensionContext);

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
            isSingleEntity
        );

        const expResult = `dataverseOrgUrl DATAVERSE_ENTITY_NAME id api data 1.0`;
        expect(result).eq(expResult);
    });

    it("getCustomRequestURL", () => {
        const powerPlatformExtensionContext: IPowerPlatformExtensionContext = {
            dataSourcePropertiesMap: new Map<string, string>([
                [schemaKey.API, "schemaKey.API"],
                [
                    schemaKey.MULTI_ENTITY_URL,
                    "{dataverseOrgUrl} {entity} {api} {data} {version}",
                ],
                [schemaKey.DATA, "schemaKey.DATA"],
                [schemaKey.DATAVERSE_API_VERSION, "1.0"],
                [schemaKey.API, "api"],
                [schemaKey.DATA, "data"],
                [schemaKey.DATAVERSE_API_VERSION, "1.0"],
            ]),
        } as IPowerPlatformExtensionContext;
        sinon
            .stub(
                PowerPlatformExtensionContextManager,
                "getPowerPlatformExtensionContext"
            )
            .returns(powerPlatformExtensionContext);

        sinon.stub(schemaHelper, "getEntity").returns(
            new Map<string, string>([
                [
                    schemaEntityKey.FETCH_QUERY_PARAMETERS,
                    "_fetchQueryParameters",
                ],
                [
                    schemaEntityKey.DATAVERSE_ENTITY_NAME,
                    "DATAVERSE_ENTITY_NAME",
                ],
            ])
        );

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
        expect(result).eq(requestUrl + '/' + attributeType);
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
