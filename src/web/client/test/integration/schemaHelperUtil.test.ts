/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import sinon from "sinon";
import {
    entityAttributesWithBase64Encoding,
    schemaEntityName,
    schemaKey,
} from "../../schema/constants";
import * as portalSchemaReader from "../../schema/portalSchemaReader";
import {
    getPortalSchema,
    getEntity,
    getAttributePath,
    isBase64Encoded,
    encodeAsBase64,
    isWebFileV2,
    getLanguageIdCodeMap,
    getWebsiteIdToLanguageMap,
    getwebsiteLanguageIdToPortalLanguageMap,
    useOctetStreamContentType,
} from "../../utilities/schemaHelperUtil";
import {
    portal_schema_V1,
    portal_schema_V2,
} from "../integration/portalSchemaReader.mock";
import WebExtensionContext from "../../WebExtensionContext";
import * as Constants from "../../common/constants";

describe("schemaHelperUtil", () => {
    afterEach(() => {
        sinon.restore();
    });
    it("getPortalSchema_shouldReturnPortalSchemaV2_whenSchemaIsPortalschemav2", () => {
        //Act
        const schema = "portalschemav2";
        //Action
        const result = getPortalSchema(schema);
        //Assert

        expect(result).deep.equal(portal_schema_V2);
    });

    it("getPortalSchema_shouldReturnPortalSchemaV1_whenSchemaIsNotPortalschemav2", () => {
        //Act
        const schema = "portalschemaV1";
        //Action
        const result = getPortalSchema(schema);
        //Assert

        expect(result).deep.equal(portal_schema_V1);
    });

    it("getEntity_shouldReturnEntitiesSchemaMap_whenSchemaIsPortalschemav2", () => {
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

        sinon
            .stub(portalSchemaReader, "getDataSourcePropertiesMap")
            .returns(
                new Map<string, string>([
                    [schemaKey.SINGLE_ENTITY_URL, schemaKey.SINGLE_ENTITY_URL],
                ])
            );

        sinon
            .stub(portalSchemaReader, "getEntitiesSchemaMap")
            .returns(entitiesSchemaMap);
        WebExtensionContext.setWebExtensionContext("", "", queryParamsMap);
        //Action
        const result = getEntity(entity);
        //Assert
        expect(result).deep.be.eq(entityMap);
    });

    it("getEntity_shouldReturnEntitiesSchemaMap_whenQueryParamsMapIsNotPortalschemav1", () => {
        //Act
        const schema = "portalschemav1";
        const entity = "webPages";
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, schema],
        ]);

        const entityMap = new Map<string, string>([["test", "Entity"]]);

        const entitiesSchemaMap = new Map<string, Map<string, string>>([
            [entity, entityMap],
        ]);

        sinon
            .stub(portalSchemaReader, "getDataSourcePropertiesMap")
            .returns(
                new Map<string, string>([
                    [schemaKey.SINGLE_ENTITY_URL, schemaKey.SINGLE_ENTITY_URL],
                ])
            );

        sinon
            .stub(portalSchemaReader, "getEntitiesSchemaMap")
            .returns(entitiesSchemaMap);
        WebExtensionContext.setWebExtensionContext("", "", queryParamsMap);

        //Action
        const result = getEntity(entity);
        //Assert

        expect(result).equal(entityMap);
    });

    it("getEntity_shouldReturnEmptySchema_whenEntityDoNotMapAndschemaIsportalschemav2", () => {
        //Act
        const schema = "portalschemav2";
        const entity = "webPages1";
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, schema],
        ]);

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
        WebExtensionContext.setWebExtensionContext("", "", queryParamsMap);
        //Action
        const result = getEntity(entity);
        //Assert

        expect(result).undefined;
    });

    it("getEntity_shouldReturnEmptySchema_whenEntityDoNotMapAndschemaIsNotPortalschemav2", () => {
        //Act
        const schema = "portalschemav1";
        const entity = "webPages";
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, schema],
        ]);

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
        WebExtensionContext.setWebExtensionContext("", "", queryParamsMap);
        //Action
        const result = getEntity(entity);
        //Assert
        expect(result).undefined;
    });

    it("getAttributePath_souldReturnSourceAndRelativePath_whenAttributeHavingDot", () => {
        //Act
        const attribute = "test.file";
        //Action
        const result = getAttributePath(attribute);
        //Assert
        expect(result.source).eq("test");
        expect(result.relativePath).eq("file");
    });

    it("getAttributePath_shouldReturnRelativePathEmpty_whenAttributeDoNotHaveDot", () => {
        //Act
        const attribute = "test";
        //Action
        const result = getAttributePath(attribute);
        //Assert
        expect(result.source).eq("test");
        expect(result.relativePath).empty;
    });

    it("getAttributePath_shouldReturnSourceAndRelativePathAsBlank_whenAttributeIsEmpty", () => {
        //Act
        const attribute = "";
        //Action
        const result = getAttributePath(attribute);
        //Assert
        expect(result.source).empty;
        expect(result.relativePath).empty;
    });

    it("isBase64Encoded_shouldReturnTrue_whenEntityIsWEBFILESAndAttributeTypeIsDocumentbody", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        //Action
        const result = isBase64Encoded(entity, attributeType);
        //Assert
        expect(result).true;
    });

    it("isBase64Encoded_shouldReturnTrue_whenEntityIsWEBFILESAndAttributeTypeIsFilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = isBase64Encoded(entity, attributeType);
        //Assert
        expect(result).true;
    });

    it("isBase64Encoded_shouldReturnFalse_whenEntityIsNotIsWEBFILESAndAttributeTypeIsFilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBTEMPLATES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = isBase64Encoded(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("isBase64Encoded_shouldReturnFalse_whenEntityIsNotIsWEBFILESAndAttributeTypeIsDocumentbody", () => {
        //Act
        const entity = schemaEntityName.WEBTEMPLATES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        //Action
        const result = isBase64Encoded(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("encodeAsBase64_shouldReturnTrue_whenEntityIsWEBFILESAndAttributeTypeIsdocumentbody", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        //Action
        const result = encodeAsBase64(entity, attributeType);
        //Assert
        expect(result).true;
    });

    it("encodeAsBase64_shouldReturnFalse_whenEntityIsWEBFILESAndAttributeTypeIsNotdocumentbody", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = encodeAsBase64(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("encodeAsBase64_shouldReturnFalse_whenEntityIsNotWEBFILESAndAttributeTypeIsfilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBTEMPLATES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = encodeAsBase64(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("isWebFileV2_shouldReturnTrue_whenEntityIsWEBFILESAndAttributeTypeIsFilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = isWebFileV2(entity, attributeType);
        //Assert
        expect(result).true;
    });

    it("isWebFileV2_shouldReturnFalse_whenEntityIsNotWEBFILESAndAttributeTypeIsFilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBPAGES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = isWebFileV2(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("isWebFileV2_shouldReturnFalse_whenEntityIsWEBFILESAndAttributeTypeIsNotFilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBPAGES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        //Action
        const result = isWebFileV2(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("getLanguageIdCodeMap_shouldReturnlanguageIdCodeMapWithCorrectMapping_whenResultIsProvided", () => {
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

    it("getLanguageIdCodeMap_shouldReturnlanguageIdCodeMapWithCorrectMapping_whenSchemaIsNotPortalschemav2", () => {
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

    it("getLanguageIdCodeMap_shouldReturnEmpty_whenResultIsNull", () => {
        //Act
        const result = null;
        const schema = "portalschemav1";
        //Action
        const resultData = getLanguageIdCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getLanguageIdCodeMap_shouldReturnEmpty_whenResultIsUndefined", () => {
        //Act
        const result = undefined;
        const schema = "portalschemav1";
        //Action
        const resultData = getLanguageIdCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getLanguageIdCodeMap_shouldReturnEmpty_whenValueDoesNotExists", () => {
        //Act
        const result = {};
        const schema = "portalschemav1";
        //Action
        const resultData = getLanguageIdCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getLanguageIdCodeMap_shouldReturnEmpty_whenValueLengthIsZeroDoesNotExists", () => {
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

    it("getLanguageIdCodeMap_shouldReturnEmpty_whenValueIsNull", () => {
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

    it("getLanguageIdCodeMap_shouldReturnEmpty_whenValueIsUndefined", () => {
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

    it("getWebsiteIdToLanguageMap_shouldReturnWebsiteIdToLanguageMapWithCorrectMapping_whenResultIsPassed", () => {
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

    it("getWebsiteIdToLanguageMap_shouldReturnEmpty_whenResultIsNull", () => {
        //Act
        const result = null;

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLanguageMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLanguageMap_shouldReturnEmpty_whenResultIsUndefined", () => {
        //Act
        const result = undefined;

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLanguageMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLanguageMap_shouldReturnEmpty_whenValueDoesNotExists", () => {
        //Act
        const result = {};

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLanguageMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLanguageMap_shouldReturnEmpty_whenValueIsUndefined", () => {
        //Act
        const result = { value: undefined };

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLanguageMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLanguageMap_shouldReturnEmpty_whenValueIsNull", () => {
        //Act
        const result = { value: null };

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLanguageMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLanguageMap_shouldReturnEmpty_whenValueEmptyArray", () => {
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

    it("getwebsiteLanguageIdToPortalLanguageMap_shouldReturnEmpty_whenValueEmptyArray", () => {
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

    it("getwebsiteLanguageIdToPortalLanguageMap_shouldReturnEmpty_whenValueUndefined", () => {
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

    it("getwebsiteLanguageIdToPortalLanguageMap_shouldReturnEmpty_whenValueHavingEmptyArray", () => {
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

    it("getwebsiteLanguageIdToPortalLanguageMap_shouldReturnEmpty_whenResultIsNull", () => {
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

    it("getwebsiteLanguageIdToPortalLanguageMap_shouldReturnEmpty_whenResultIsUndefined", () => {
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

    it("getwebsiteLanguageIdToPortalLanguageMap_shouldReturnEmpty_whenResultIsUndefined", () => {
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

    it("useOctetStreamContentType_shouldReturnTrue_whenEntityIsWEBFILES_and_attributeTypeIsFilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = useOctetStreamContentType(entity, attributeType);
        //Assert
        expect(result).true;
    });

    it("useOctetStreamContentType_shouldReturnFalse_whenEntityIsNotWEBFILES_and_attributeTypeIsFilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBPAGES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = useOctetStreamContentType(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("useOctetStreamContentType_shouldReturnFalse_whenEntityIsWEBFILES_and_attributeTypeIsNotFilecontent", () => {
        //Act
        const entity = schemaEntityName.WEBPAGES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        //Action
        const result = useOctetStreamContentType(entity, attributeType);
        //Assert
        expect(result).false;
    });
});
