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
    getLcidCodeMap,
    getWebsiteIdToLcidMap,
    getWebsiteLanguageIdToPortalLanguageIdMap,
    useOctetStreamContentType,
} from "../../utilities/schemaHelperUtil";
import { portal_schema_V1, portal_schema_V2 } from "../../schema/portalSchema";
import WebExtensionContext from "../../WebExtensionContext";
import * as Constants from "../../common/constants";

describe("schemaHelperUtil", () => {
    afterEach(() => {
        sinon.restore();
    });
    it("getPortalSchema_withPortalschemav2_shouldReturnPortalSchemaV2", () => {
        //Act
        const schema = "portalschemav2";
        //Action
        const result = getPortalSchema(schema);
        //Assert

        expect(result).deep.equal(portal_schema_V2);
    });

    it("getPortalSchema_withNotPortalschemaV1_shouldReturnPortalSchemaV1", () => {
        //Act
        const schema = "portalschemaV1";
        //Action
        const result = getPortalSchema(schema);
        //Assert

        expect(result).deep.equal(portal_schema_V1);
    });

    it("getEntity_withPortalschemav2_shouldReturnEntitiesSchemaMap", () => {
        //Act
        const entity = "webPages";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_ID, "orgId"],
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

        WebExtensionContext.schema = Constants.portalSchemaVersion.V2;
        WebExtensionContext.setWebExtensionContext("", "", queryParamsMap);
        //Action
        const result = getEntity(entity);
        //Assert
        expect(result).deep.be.eq(entityMap);
    });

    it("getEntity_whenQueryParamsMapIsNotPortalschemav1_shouldReturnEntitiesSchemaMap", () => {
        //Act
        const entity = "webPages";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_ID, "orgId"],
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

        WebExtensionContext.schema = Constants.portalSchemaVersion.V1;
        WebExtensionContext.setWebExtensionContext("", "", queryParamsMap);

        //Action
        const result = getEntity(entity);
        //Assert

        expect(result).equal(entityMap);
    });

    it("getEntity_whenEntityDoNotMapAndschemaIsportalschemav2_shouldReturnEmptySchema", () => {
        //Act
        const entity = "webPages1";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_ID, "orgId"],
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

        WebExtensionContext.schema = Constants.portalSchemaVersion.V2;
        WebExtensionContext.setWebExtensionContext("", "", queryParamsMap);
        //Action
        const result = getEntity(entity);
        //Assert

        expect(result).undefined;
    });

    it("getEntity_whenEntityDoNotMapAndschemaIsNotPortalschemav2_shouldReturnEmptySchema", () => {
        //Act
        const entity = "webPages";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_ID, "orgId"],
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

        WebExtensionContext.schema = Constants.portalSchemaVersion.V1;
        WebExtensionContext.setWebExtensionContext("", "", queryParamsMap);
        //Action
        const result = getEntity(entity);
        //Assert
        expect(result).undefined;
    });

    it("getAttributePath_withAttributeHavingDot_souldReturnSourceAndRelativePath", () => {
        //Act
        const attribute = "test.file";
        //Action
        const result = getAttributePath(attribute);
        //Assert
        expect(result.source).eq("test");
        expect(result.relativePath).eq("file");
    });

    it("getAttributePath_withAttributeDoNotHaveDot_shouldReturnRelativePathEmpty", () => {
        //Act
        const attribute = "test";
        //Action
        const result = getAttributePath(attribute);
        //Assert
        expect(result.source).eq("test");
        expect(result.relativePath).empty;
    });

    it("getAttributePath_withHavingAttributeEmpty_shouldReturnSourceAndRelativePathAsBlank", () => {
        //Act
        const attribute = "";
        //Action
        const result = getAttributePath(attribute);
        //Assert
        expect(result.source).empty;
        expect(result.relativePath).empty;
    });

    it("isBase64Encoded_whenEntityIsWEBFILESAndAttributeTypeIsDocumentbody_shouldReturnTrue", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        //Action
        const result = isBase64Encoded(entity, attributeType);
        //Assert
        expect(result).true;
    });

    it("isBase64Encoded_whenEntityIsWEBFILESAndAttributeTypeIsFilecontent_shouldReturnTrue", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = isBase64Encoded(entity, attributeType);
        //Assert
        expect(result).true;
    });

    it("isBase64Encoded_whenEntityIsNotIsWEBFILESAndAttributeTypeIsFilecontent_shouldReturnFalse", () => {
        //Act
        const entity = schemaEntityName.WEBTEMPLATES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = isBase64Encoded(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("isBase64Encoded_whenEntityIsNotIsWEBFILESAndAttributeTypeIsDocumentbody_shouldReturnFalse", () => {
        //Act
        const entity = schemaEntityName.WEBTEMPLATES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        //Action
        const result = isBase64Encoded(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("encodeAsBase64_whenEntityIsWEBFILESAndAttributeTypeIsdocumentbody_shouldReturnTrue", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        //Action
        const result = encodeAsBase64(entity, attributeType);
        //Assert
        expect(result).true;
    });

    it("encodeAsBase64_whenEntityIsWEBFILESAndAttributeTypeIsNotdocumentbody_shouldReturnFalse", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = encodeAsBase64(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("encodeAsBase64_whenEntityIsNotWEBFILESAndAttributeTypeIsfilecontent_shouldReturnFalse", () => {
        //Act
        const entity = schemaEntityName.WEBTEMPLATES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = encodeAsBase64(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("isWebFileV2_whenEntityIsWEBFILESAndAttributeTypeIsFilecontent_shouldReturnTrue", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = isWebFileV2(entity, attributeType);
        //Assert
        expect(result).true;
    });

    it("isWebFileV2_whenEntityIsNotWEBFILESAndAttributeTypeIsFilecontent_shouldReturnFalse", () => {
        //Act
        const entity = schemaEntityName.WEBPAGES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = isWebFileV2(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("isWebFileV2_whenEntityIsWEBFILESAndAttributeTypeIsNotFilecontent_shouldReturnFalse", () => {
        //Act
        const entity = schemaEntityName.WEBPAGES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        //Action
        const result = isWebFileV2(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("getLcidCodeMap_whenResultIsProvided_shouldReturnlanguageIdCodeMapWithCorrectMapping", () => {
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
        const resultData = getLcidCodeMap(result, schema);
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getLcidCodeMap_whenSchemaIsNotPortalschemav2_shouldReturnlanguageIdCodeMapWithCorrectMapping", () => {
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
        const resultData = getLcidCodeMap(result, schema);
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getLcidCodeMap_withNullResult_shouldReturnEmpty", () => {
        //Act
        const result = null;
        const schema = "portalschemav1";
        //Action
        const resultData = getLcidCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getLcidCodeMap_whenResultIsUndefined_shouldReturnEmpty", () => {
        //Act
        const result = undefined;
        const schema = "portalschemav1";
        //Action
        const resultData = getLcidCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getLcidCodeMap_whenValueDoesNotExists_shouldReturnEmpty", () => {
        //Act
        const result = {};
        const schema = "portalschemav1";
        //Action
        const resultData = getLcidCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getLcidCodeMap_whenValueLengthIsZeroDoesNotExists_shouldReturnEmpty", () => {
        //Act
        const result = {
            value: [],
        };
        const schema = "portalschemav1";
        //Action
        const resultData = getLcidCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getLcidCodeMap_whenValueIsNull_shouldReturnEmpty", () => {
        //Act
        const result = {
            value: null,
        };
        const schema = "portalschemav1";
        //Action
        const resultData = getLcidCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getLcidCodeMap_whenValueIsUndefined_shouldReturnEmpty", () => {
        //Act
        const result = {
            value: undefined,
        };
        const schema = "portalschemav1";
        //Action
        const resultData = getLcidCodeMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLcidMap_whenResultIsPassed_shouldReturnWebsiteIdToLanguageMapWithCorrectMapping", () => {
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
        const resultData = getWebsiteIdToLcidMap(result, schema);
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getWebsiteIdToLcidMap_whenSchemaIsNotPortalschemav2_shouldReturnWebsiteIdToLanguageMapWithCorrectMapping", () => {
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
        const resultData = getWebsiteIdToLcidMap(result, schema);
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getWebsiteIdToLcidMap_whenResultIsNull_shouldReturnEmpty", () => {
        //Act
        const result = null;

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLcidMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLcidMap_whenResultIsUndefined_shouldReturnEmpty", () => {
        //Act
        const result = undefined;

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLcidMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLcidMap_whenValueDoesNotExists_shouldReturnEmpty", () => {
        //Act
        const result = {};

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLcidMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLcidMap_whenValueIsUndefined_shouldReturnEmpty", () => {
        //Act
        const result = { value: undefined };

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLcidMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLcidMap_whenValueIsNull_shouldReturnEmpty", () => {
        //Act
        const result = { value: null };

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLcidMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteIdToLcidMap_whenValueEmptyArray_shouldReturnEmpty", () => {
        //Act
        const result = { value: null };

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteIdToLcidMap(result, schema);
        //Assert
        expect(resultData).empty;
    });

    //getWebsiteLanguageIdToPortalLanguageIdMap

    it("getWebsiteLanguageIdToPortalLanguageIdMap_whenSchemaIsPortalschemav2_shouldReturnwebsiteLanguageIdToPortalLanguageMapMapWithCorrectMapping", () => {
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
        const resultData = getWebsiteLanguageIdToPortalLanguageIdMap(
            result,
            schema
        );
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getWebsiteLanguageIdToPortalLanguageIdMap_whenSchemaIsNotPortalschemav2_shouldReturnwebsiteLanguageIdToPortalLanguageMapMapWithCorrectMapping", () => {
        //Act
        const result = {
            value: [
                {
                    _adx_portallanguageid_value: "1",
                    adx_websitelanguageid: "english",
                },
                {
                    _adx_portallanguageid_value: "2",
                    adx_websitelanguageid: "hindi",
                },
                { adx_websitelanguageid: "french" },
            ],
        };

        const expectedResult = new Map<string, string>([
            ["english", "1"],
            ["hindi", "2"],
            ["french", Constants.PORTAL_LANGUAGE_DEFAULT],
        ]);
        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteLanguageIdToPortalLanguageIdMap(
            result,
            schema
        );
        //Assert
        expect(resultData).deep.equals(expectedResult);
    });

    it("getWebsiteLanguageIdToPortalLanguageIdMap_whenValueEmptyArray_shouldReturnEmpty", () => {
        //Act
        const result = { value: null };

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteLanguageIdToPortalLanguageIdMap(
            result,
            schema
        );
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteLanguageIdToPortalLanguageIdMap_whenValueUndefined_shouldReturnEmpty", () => {
        //Act
        const result = { value: undefined };

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteLanguageIdToPortalLanguageIdMap(
            result,
            schema
        );
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteLanguageIdToPortalLanguageIdMap_whenValueHavingEmptyArray_shouldReturnEmpty", () => {
        //Act
        const result = { value: [] };

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteLanguageIdToPortalLanguageIdMap(
            result,
            schema
        );
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteLanguageIdToPortalLanguageIdMap_whenResultIsNull_shouldReturnEmpty", () => {
        //Act
        const result = null;

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteLanguageIdToPortalLanguageIdMap(
            result,
            schema
        );
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteLanguageIdToPortalLanguageIdMap_whenResultIsUndefined_shouldReturnEmpty", () => {
        //Act
        const result = undefined;

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteLanguageIdToPortalLanguageIdMap(
            result,
            schema
        );
        //Assert
        expect(resultData).empty;
    });

    it("getWebsiteLanguageIdToPortalLanguageIdMap_whenResultIsUndefined_shouldReturnEmpty", () => {
        //Act
        const result = undefined;

        const schema = "portalschemav1";
        //Action
        const resultData = getWebsiteLanguageIdToPortalLanguageIdMap(
            result,
            schema
        );
        //Assert
        expect(resultData).empty;
    });

    it("useOctetStreamContentType_whenEntityIsWEBFILESAndAttributeTypeIsFilecontent_shouldReturnTrue", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = useOctetStreamContentType(entity, attributeType);
        //Assert
        expect(result).true;
    });

    it("useOctetStreamContentType_whenEntityIsNotWEBFILES_and_attributeTypeIsFilecontent_shouldReturnFalse", () => {
        //Act
        const entity = schemaEntityName.WEBPAGES;
        const attributeType = entityAttributesWithBase64Encoding.filecontent;
        //Action
        const result = useOctetStreamContentType(entity, attributeType);
        //Assert
        expect(result).false;
    });

    it("useOctetStreamContentType_whenEntityIsWEBFILES_and_attributeTypeIsNotFilecontent_shouldReturnFalse", () => {
        //Act
        const entity = schemaEntityName.WEBPAGES;
        const attributeType = entityAttributesWithBase64Encoding.documentbody;
        //Action
        const result = useOctetStreamContentType(entity, attributeType);
        //Assert
        expect(result).false;
    });
});
