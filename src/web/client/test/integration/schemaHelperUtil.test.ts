/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import sinon, { stub, assert } from "sinon";
import {
    entityAttributesWithBase64Encoding,
    schemaEntityName,
    schemaKey,
} from "../../schema/constants";
import {
    getPortalSchema,
    getEntity,
    getAttributeParts,
    isBase64Encoded,
    useBase64Encoding,
    isWebFileV2OctetStream,
    getLanguageIdCodeMap,
    getWebsiteIdToLanguageMap,
    getwebsiteLanguageIdToPortalLanguageMap,
} from "../../utilities/schemaHelperUtil";
import {
    portal_schema_V1,
    portal_schema_V2,
} from "../integration/portalSchemaReader.mock";
import WebExtensionContext, {
    IWebExtensionContext,
} from "../../WebExtensionContext";
import * as Constants from "../../common/constants";

describe("schemaHelperUtil_ShouldReturnportalSchemaV2", () => {
    afterEach(() => {
        sinon.restore();
    });
    it("getPortalSchema_ShouldReturnportalSchemaV2", () => {
        //Act
        const schema = "portalschemav2";
        //Action
        const result = getPortalSchema(schema);
        //Assert

        expect(result).deep.equal(portal_schema_V2);
    });

    it("getPortalSchema_ShouldReturnportalSchemaV2IfSchemaIsInCaps", () => {
        //Act
        const schema = "portalschemav2".toUpperCase();
        //Action
        const result = getPortalSchema(schema);
        //Assert

        expect(result).deep.equal(portal_schema_V2);
    });

    it("getPortalSchema_ShouldReturnportalSchemaV1IfSchemaDoNotMatch", () => {
        //Act
        const schema = "portalschemaV1";
        //Action
        const result = getPortalSchema(schema);
        //Assert

        expect(result).deep.equal(portal_schema_V1);
    });

    it("getEntity_ShouldReturnEntitiesSchemaMapWhenSchemaIsportalschemav2", () => {
        //Act
        const schema = "portalschemav2";
        const entity = "webPages";
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, schema],
        ]);

        const entityMap = new Map<string, string>([["test", "Entity"]]);

        const entitiesSchemaMap = new Map<string, Map<string, string>>([
            [entity, entityMap],
        ]);
        const getWebExtensionContext = stub(
            WebExtensionContext,
            "getWebExtensionContext"
        ).returns({
            queryParamsMap: queryParamsMap,
            entitiesSchemaMap: entitiesSchemaMap,
        } as IWebExtensionContext);
        //Action
        const result = getEntity(entity);
        //Assert

        expect(result).equal(entityMap);
        assert.calledOnce(getWebExtensionContext);
    });

    it("getEntity_ShouldReturnEntitiesSchemaMapWhenSchemaIsportalschemav2AndInCaps", () => {
        //Act
        const schema = "portalschemav2".toUpperCase();
        const entity = "webPages";
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, schema],
        ]);

        const entityMap = new Map<string, string>([["test", "Entity"]]);

        const entitiesSchemaMap = new Map<string, Map<string, string>>([
            [entity, entityMap],
        ]);
        const getWebExtensionContext = stub(
            WebExtensionContext,
            "getWebExtensionContext"
        ).returns({
            queryParamsMap: queryParamsMap,
            entitiesSchemaMap: entitiesSchemaMap,
        } as IWebExtensionContext);
        //Action
        const result = getEntity(entity);
        //Assert

        expect(result).equal(entityMap);
        assert.calledOnce(getWebExtensionContext);
    });

    it("getEntity_ShouldReturnEntitiesSchemaMapWhenSchemaIsportalschemav2AndInCaps", () => {
        //Act
        const schema = "portalschemav1".toUpperCase();
        const entity = "webPages";
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, schema],
        ]);

        const entityMap = new Map<string, string>([["test", "Entity"]]);

        const entitiesSchemaMap = new Map<string, Map<string, string>>([
            [entity, entityMap],
        ]);
        const getWebExtensionContext = stub(
            WebExtensionContext,
            "getWebExtensionContext"
        ).returns({
            queryParamsMap: queryParamsMap,
            entitiesSchemaMap: entitiesSchemaMap,
        } as IWebExtensionContext);
        //Action
        const result = getEntity(entity);
        //Assert

        expect(result).equal(entityMap);
        assert.calledOnce(getWebExtensionContext);
    });

    it("getEntity_ShouldReturnEntitiesSchemaMapWhenQueryParamsMapIsNotSchema", () => {
        //Act
        const schema = "portalschemav2";
        const entity = "webPages";
        const queryParamsMap = new Map<string, string>([
            [schemaKey.MULTI_ENTITY_URL, schema],
        ]);

        const entityMap = new Map<string, string>([["test", "Entity"]]);

        const entitiesSchemaMap = new Map<string, Map<string, string>>([
            [entity, entityMap],
        ]);
        const getWebExtensionContext = stub(
            WebExtensionContext,
            "getWebExtensionContext"
        ).returns({
            queryParamsMap: queryParamsMap,
            entitiesSchemaMap: entitiesSchemaMap,
        } as IWebExtensionContext);
        //Action
        const result = getEntity(entity);
        //Assert

        expect(result).equal(entityMap);
        assert.calledOnce(getWebExtensionContext);
    });

    it("getEntity_ShouldReturnEmptySchemaWhenEntityDoNotMapAndschemaIsportalschemav2", () => {
        //Act
        const schema = "portalschemav2";
        const entity = "webPages";
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, schema],
        ]);

        const entityMap = new Map<string, string>([["test", "Entity"]]);

        const entitiesSchemaMap = new Map<string, Map<string, string>>([
            ["entity", entityMap],
        ]);
        const getWebExtensionContext = stub(
            WebExtensionContext,
            "getWebExtensionContext"
        ).returns({
            queryParamsMap: queryParamsMap,
            entitiesSchemaMap: entitiesSchemaMap,
        } as IWebExtensionContext);
        //Action
        const result = getEntity(entity);
        //Assert

        expect(result).undefined;
        assert.calledOnce(getWebExtensionContext);
    });

    it("getEntity_ShouldReturnEmptySchemaWhenEntityDoNotMapAndschemaIsNotPortalschemav2", () => {
        //Act
        const schema = "portalschemav1";
        const entity = "webPages";
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, schema],
        ]);

        const entityMap = new Map<string, string>([["test", "Entity"]]);

        const entitiesSchemaMap = new Map<string, Map<string, string>>([
            ["entity", entityMap],
        ]);
        const getWebExtensionContext = stub(
            WebExtensionContext,
            "getWebExtensionContext"
        ).returns({
            queryParamsMap: queryParamsMap,
            entitiesSchemaMap: entitiesSchemaMap,
        } as IWebExtensionContext);
        //Action
        const result = getEntity(entity);
        //Assert
        expect(result).undefined;
        assert.calledOnce(getWebExtensionContext);
    });
    it("getAttributeParts_souldReturnSourceAndRelativePath", () => {
        //Act
        const attribute = "test.file";
        //Action
        const result = getAttributeParts(attribute);
        //Assert
        expect(result.source).eq("test");
        expect(result.relativePath).eq("file");
    });

    it("getAttributeParts_shouldReturnRelativePathEmpty", () => {
        //Act
        const attribute = "test";
        //Action
        const result = getAttributeParts(attribute);
        //Assert
        expect(result.source).eq("test");
        expect(result.relativePath).empty;
    });

    it("getAttributeParts_shouldReturnSourceAndRelativePathAsBlank", () => {
        //Act
        const attribute = "";
        //Action
        const result = getAttributeParts(attribute);
        //Assert
        expect(result.source).empty;
        expect(result.relativePath).empty;
    });

    it("isBase64Encoded_shouldReturnTrueWhenEntityIsWEBFILES_and_attributeTypeIsDocumentbody", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        //Action
        const result = isBase64Encoded(entity, attributeType);
        //Assert
        expect(result).true;
    });

    it("isBase64Encoded_shouldReturnTrueWhenEntityIsWEBFILES_and_attributeTypeIsFilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = isBase64Encoded(entity, attributeType);
        //Assert
        expect(result).true;
    });

    it("isBase64Encoded_shouldReturnFalseWhenEntityIsNotIsWEBFILES_and_attributeTypeIsFilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBTEMPLATES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = isBase64Encoded(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("isBase64Encoded_shouldReturnFalseWhenEntityIsNotIsWEBFILES_and_attributeTypeIsDocumentbody", () => {
        //Act
        const entity = schemaEntityName.WEBTEMPLATES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        //Action
        const result = isBase64Encoded(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("useBase64Encoding_shouldReturnTrueWhenEntityIsWEBFILES_and_attributeTypeIsdocumentbody", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        //Action
        const result = useBase64Encoding(entity, attributeType);
        //Assert
        expect(result).true;
    });

    it("useBase64Encoding_shouldReturnFalseWhenEntityIsWEBFILES_and_attributeTypeIsNotdocumentbody", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = useBase64Encoding(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("useBase64Encoding_shouldReturnFalseWhenEntityIsNotWEBFILES_and_attributeTypeIsfilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBTEMPLATES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = useBase64Encoding(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("useBase64Encoding_shouldReturnTrueWhenEntityIsWEBFILES_and_attributeTypeIsFilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = isWebFileV2OctetStream(entity, attributeType);
        //Assert
        expect(result).true;
    });

    it("useBase64Encoding_shouldReturnFalseWhenEntityIsNotWEBFILES_and_attributeTypeIsFilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBPAGES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = isWebFileV2OctetStream(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("useBase64Encoding_shouldReturnFalseWhenEntityIsWEBFILES_and_attributeTypeIsNotFilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBPAGES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        //Action
        const result = isWebFileV2OctetStream(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("getLanguageIdCodeMap_shouldReturnlanguageIdCodeMapWithCorrectMapping", () => {
        //Act
        const result = {
            value: [
                { lcid: 1022, languagecode: "english" },
                { lcid: 1024, languagecode: "hindi" },
                { languagecode: "french" },
            ],
        };

        const expectedResult = new Map<string, string>([
            ["1022", "english"],
            ["1024", "hindi"],
            [Constants.PORTAL_LANGUAGE_DEFAULT, "french"],
        ]);
        const schema = "portalschemav2";
        //Action
        const resultData = getLanguageIdCodeMap(result, schema);
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getLanguageIdCodeMap_shouldReturnlanguageIdCodeMapWithCorrectMappingWhenSchemaIsInCaps", () => {
        //Act
        const result = {
            value: [
                { lcid: 1022, languagecode: "english" },
                { lcid: 1024, languagecode: "hindi" },
                { languagecode: "french" },
            ],
        };

        const expectedResult = new Map<string, string>([
            ["1022", "english"],
            ["1024", "hindi"],
            [Constants.PORTAL_LANGUAGE_DEFAULT, "french"],
        ]);
        const schema = "portalschemav2".toUpperCase();
        //Action
        const resultData = getLanguageIdCodeMap(result, schema);
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getLanguageIdCodeMap_shouldReturnlanguageIdCodeMapWithCorrectMappingWhenSchemaIsNotPortalschemav2", () => {
        //Act
        const result = {
            value: [
                { adx_lcid: "1022", adx_languagecode: "english" },
                { adx_lcid: "1024", adx_languagecode: "hindi" },
                { adx_languagecode: "french" },
            ],
        };

        const expectedResult = new Map<string, string>([
            ["1022", "english"],
            ["1024", "hindi"],
            [Constants.PORTAL_LANGUAGE_DEFAULT, "french"],
        ]);
        const schema = "portalschemav1";
        //Action
        const resultData = getLanguageIdCodeMap(result, schema);
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getLanguageIdCodeMap_shouldReturnEmptyWhenResultIsNull", () => {
        //Act
        const result = null;
        const schema = "portalschemav1";
        //Action
        const resultData = getLanguageIdCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getLanguageIdCodeMap_shouldReturnEmptyWhenResultIsUndefined", () => {
        //Act
        const result = undefined;
        const schema = "portalschemav1";
        //Action
        const resultData = getLanguageIdCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getLanguageIdCodeMap_shouldReturnEmptyWhenValueDoesNotExists", () => {
        //Act
        const result = {};
        const schema = "portalschemav1";
        //Action
        const resultData = getLanguageIdCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getLanguageIdCodeMap_shouldReturnEmptyWhenValueLengthIsZeroDoesNotExists", () => {
        //Act
        const result = {
            value: [],
        };
        const schema = "portalschemav1";
        //Action
        const resultData = getLanguageIdCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getLanguageIdCodeMap_shouldReturnEmptyWhenValueIsNull", () => {
        //Act
        const result = {
            value: null,
        };
        const schema = "portalschemav1";
        //Action
        const resultData = getLanguageIdCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getLanguageIdCodeMap_shouldReturnEmptyWhenValueIsUndefined", () => {
        //Act
        const result = {
            value: undefined,
        };
        const schema = "portalschemav1";
        //Action
        const resultData = getLanguageIdCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLanguageMap_shouldReturnWebsiteIdToLanguageMapWithCorrectMapping", () => {
        //Act
        const result = {
            value: [
                {
                    powerpagesiteid: "1",
                    content: '{ "website_language": "english" }',
                },
                {
                    powerpagesiteid: "2",
                    content: '{"website_language": "hindi" }',
                },
                { content: '{ "website_language": "french" }' },
            ],
        };

        const expectedResult = new Map<string | null, string>([
            ["1", "english"],
            ["2", "hindi"],
            [null, "french"],
        ]);
        const schema = "portalschemav2";
        //Action
        const resultData = getWebsiteIdToLanguageMap(result, schema);
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getWebsiteIdToLanguageMap_shouldReturnWebsiteIdToLanguageMapWithCorrectMappingWhenSchemaIsInCaps", () => {
        //Act
        const result = {
            value: [
                {
                    powerpagesiteid: "1",
                    content: '{ "website_language": "english" }',
                },
                {
                    powerpagesiteid: "2",
                    content: '{"website_language": "hindi" }',
                },
                { content: '{ "website_language": "french" }' },
            ],
        };

        const expectedResult = new Map<string | null, string>([
            ["1", "english"],
            ["2", "hindi"],
            [null, "french"],
        ]);
        const schema = "portalschemav2".toUpperCase();
        //Action
        const resultData = getWebsiteIdToLanguageMap(result, schema);
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getWebsiteIdToLanguageMap_shouldReturnWebsiteIdToLanguageMapWithCorrectMapping_whenSchemaIsNotPortalschemav2", () => {
        //Act
        const result = {
            value: [
                {
                    adx_websiteid: "1",
                    adx_website_language: "english",
                },
                {
                    adx_websiteid: "2",
                    adx_website_language: "hindi",
                },
                { adx_website_language: "french" },
            ],
        };

        const expectedResult = new Map<string | null, string>([
            ["1", "english"],
            ["2", "hindi"],
            [null, "french"],
        ]);
        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLanguageMap(result, schema);
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getWebsiteIdToLanguageMap_shouldReturnEmptyWhenResultIsNull", () => {
        //Act
        const result = null;

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLanguageMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLanguageMap_shouldReturnEmptyWhenResultIsUndefined", () => {
        //Act
        const result = undefined;

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLanguageMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLanguageMap_shouldReturnEmptyWhenValueDoesNotExists", () => {
        //Act
        const result = {};

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLanguageMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLanguageMap_shouldReturnEmptyWhenValueIsUndefined", () => {
        //Act
        const result = { value: undefined };

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLanguageMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLanguageMap_shouldReturnEmptyWhenValueIsNull", () => {
        //Act
        const result = { value: null };

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLanguageMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLanguageMap_shouldReturnEmptyWhenValueEmptyArray", () => {
        //Act
        const result = { value: null };

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLanguageMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    //getwebsiteLanguageIdToPortalLanguageMap

    it("getwebsiteLanguageIdToPortalLanguageMap_shouldReturnwebsiteLanguageIdToPortalLanguageMapMapWithCorrectMapping_whenSchemaIsPortalschemav2", () => {
        //Act
        const result = {
            value: [
                {
                    powerpagesitelanguageid: "1",
                },
                {
                    powerpagesitelanguageid: "2",
                },
                { abc: "french" },
            ],
        };

        const expectedResult = new Map<string | null, string | null>([
            ["1", "1"],
            ["2", "2"],
            [null, null],
        ]);
        const schema = "portalschemav2";
        //Action
        const resultData = getwebsiteLanguageIdToPortalLanguageMap(
            result,
            schema
        );
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getwebsiteLanguageIdToPortalLanguageMap_shouldReturnwebsiteLanguageIdToPortalLanguageMapMapWithCorrectMapping_whenSchemaIsInCaps", () => {
        //Act
        const result = {
            value: [
                {
                    powerpagesitelanguageid: "1",
                },
                {
                    powerpagesitelanguageid: "2",
                },
                { abc: "french" },
            ],
        };

        const expectedResult = new Map<string | null, string | null>([
            ["1", "1"],
            ["2", "2"],
            [null, null],
        ]);
        const schema = "portalschemav2".toUpperCase();
        //Action
        const resultData = getwebsiteLanguageIdToPortalLanguageMap(
            result,
            schema
        );
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getwebsiteLanguageIdToPortalLanguageMap_shouldReturnwebsiteLanguageIdToPortalLanguageMapMapWithCorrectMapping_whenSchemaIsNotPortalschemav2", () => {
        //Act
        const result = {
            value: [
                {
                    adx_portallanguageid_value: "1",
                    adx_websitelanguageid: "english",
                },
                {
                    adx_portallanguageid_value: "2",
                    adx_websitelanguageid: "hindi",
                },
                { adx_websitelanguageid: "french" },
            ],
        };

        const expectedResult = new Map<string | null, string>([
            ["english", "1"],
            ["hindi", "2"],
            ["french", Constants.PORTAL_LANGUAGE_DEFAULT],
        ]);
        const schema = "portalschemav1";
        //Action
        const resultData = getwebsiteLanguageIdToPortalLanguageMap(
            result,
            schema
        );
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getwebsiteLanguageIdToPortalLanguageMap_shouldReturnEmptyWhenValueEmptyArray", () => {
        //Act
        const result = { value: null };

        const schema = "portalschemav1";
        //Action
        const resultData = getwebsiteLanguageIdToPortalLanguageMap(
            result,
            schema
        );
        //Assert
        expect(resultData).empty;
    });

    it("getwebsiteLanguageIdToPortalLanguageMap_shouldReturnEmptyWhenValueUndefined", () => {
        //Act
        const result = { value: undefined };

        const schema = "portalschemav1";
        //Action
        const resultData = getwebsiteLanguageIdToPortalLanguageMap(
            result,
            schema
        );
        //Assert
        expect(resultData).empty;
    });

    it("getwebsiteLanguageIdToPortalLanguageMap_shouldReturnEmptyWhenValueHavingEmptyArray", () => {
        //Act
        const result = { value: [] };

        const schema = "portalschemav1";
        //Action
        const resultData = getwebsiteLanguageIdToPortalLanguageMap(
            result,
            schema
        );
        //Assert
        expect(resultData).empty;
    });

    it("getwebsiteLanguageIdToPortalLanguageMap_shouldReturnEmptyWhenResultIsNull", () => {
        //Act
        const result = null;

        const schema = "portalschemav1";
        //Action
        const resultData = getwebsiteLanguageIdToPortalLanguageMap(
            result,
            schema
        );
        //Assert
        expect(resultData).empty;
    });

    it("getwebsiteLanguageIdToPortalLanguageMap_shouldReturnEmptyWhenResultIsUndefined", () => {
        //Act
        const result = undefined;

        const schema = "portalschemav1";
        //Action
        const resultData = getwebsiteLanguageIdToPortalLanguageMap(
            result,
            schema
        );
        //Assert
        expect(resultData).empty;
    });
});
