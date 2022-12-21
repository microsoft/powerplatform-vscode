/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as schemaHelperUtil from "../../utilities/schemaHelperUtil";
import * as portalSchemaReadeMock from "../integration/portalSchemaReader.mock";
import { schemaEntityKey } from "../../../client/schema/constants";
import Sinon, { stub } from "sinon";
import {
    getEntitiesSchemaMap,
    getDataSourcePropertiesMap,
    getEntitiesFolderNameMap,
} from "../../../client/schema/portalSchemaReader";
import { expect } from "chai";

describe("portalSchemaReader", () => {
    afterEach(() => {
        Sinon.restore();
    });
    it("getEntitiesSchemaMap_withValidSchema_shouldBeMap", () => {
        stub(schemaHelperUtil, "getPortalSchema").returns(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            portalSchemaReadeMock.schema_data as any
        );

        const result = getEntitiesSchemaMap("testSchema") as Map<
            string,
            Map<string, string>
        >;

        portalSchemaReadeMock.schema_data.entities.entity.forEach(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (element: any) => {
                const entitiesDetailsMap = result.get(
                    element._vscodeentityname
                );
                if (entitiesDetailsMap) {
                    for (const [key, value] of entitiesDetailsMap) {
                        expect(value).eq(element[key]);
                    }
                } else {
                    expect.fail();
                }
            }
        );
    });

    it("getEntitiesSchemaMap_withEmptyEntity_shouldBeEmptyMap", () => {
        stub(schemaHelperUtil, "getPortalSchema").returns(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            portalSchemaReadeMock.schema_data_with_empty_entity as any
        );

        const result = getEntitiesSchemaMap("testSchema");
        for (const [key] of result) {
            expect(key).equal(undefined);
        }
        expect(result.size).eq(0);
    });

    it("getDataSourcePropertiesMap_withValidSchema_shouldBeMap", () => {
        stub(schemaHelperUtil, "getPortalSchema").returns(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            portalSchemaReadeMock.schema_data as any
        );
        const result = getDataSourcePropertiesMap("testSchema");
        expect(result?.get("data")).equal("data");
        expect(result?.get("version")).equal("v9.2");
        expect(result?.get("schema")).equal("portalschemav2");
        expect(result?.get("singleEntityURL")).equal(
            "{dataverseOrgUrl}/{api}/{data}/{version}/{entity}({entityId})"
        );
        expect(result?.get("multiEntityURL")).equal(
            "{dataverseOrgUrl}/{api}/{data}/{version}/{entity}"
        );
        expect(result?.get("api")).equal("api");
    });

    it("getDataSourcePropertiesMap_withEmptySchema_shouldBeEmptyMap", () => {
        stub(schemaHelperUtil, "getPortalSchema").returns(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            portalSchemaReadeMock.schema_data_with_empty_dataSourceProperties as any
        );
        const result = getDataSourcePropertiesMap("testSchema");
        expect(result.size).eq(0);
    });

    it("getEntitiesFolderNameMap_withValidEntitiesSchema_shouldBeMap", () => {
        const folderNameMap = new Map<string, string>([
            [schemaEntityKey.FILE_FOLDER_NAME, "testFolderName"],
        ]);

        const folderNameMap1 = new Map<string, string>([
            [schemaEntityKey.FILE_FOLDER_NAME, "testFolderName1"],
        ]);

        const folderNameMap2 = new Map<string, string>([
            [schemaEntityKey.FILE_FOLDER_NAME, "testFolderName2"],
        ]);

        const entitiesSchemaMap = new Map<string, Map<string, string>>([
            ["webfiles", folderNameMap],
            ["webpages", folderNameMap1],
            ["webtemplates", folderNameMap2],
        ]);

        const result = getEntitiesFolderNameMap(entitiesSchemaMap);
        expect(result?.get("webfiles")).equal("testFolderName");
        expect(result?.get("webpages")).equal("testFolderName1");
        expect(result?.get("webtemplates")).equal("testFolderName2");
    });

    it("getEntitiesFolderNameMap_With_Different_schemaEntityKey_Should_Not_Map", () => {
        const folderNameMap = new Map<string, string>([
            [schemaEntityKey.ATTRIBUTES, "testFolderName"],
        ]);

        const folderNameMap1 = new Map<string, string>([
            [schemaEntityKey.DATAVERSE_ENTITY_NAME, "testFolderName1"],
        ]);

        const folderNameMap2 = new Map<string, string>([
            [schemaEntityKey.FETCH_QUERY_PARAMETERS, "testFolderName2"],
        ]);

        const entitiesSchemaMap = new Map<string, Map<string, string>>([
            ["webfiles", folderNameMap],
            ["webpages", folderNameMap1],
            ["webtemplates", folderNameMap2],
        ]);
        const result = getEntitiesFolderNameMap(entitiesSchemaMap);
        expect(result.size).eq(0);
    });

    it("getEntitiesFolderNameMap_With_Different_entitiesSchemaKey_Should_Not_Map", () => {
        const folderNameMap = new Map<string, string>([
            [schemaEntityKey.FILE_FOLDER_NAME, "testFolderName"],
        ]);

        const folderNameMap1 = new Map<string, string>([
            [schemaEntityKey.FILE_FOLDER_NAME, "testFolderName1"],
        ]);

        const folderNameMap2 = new Map<string, string>([
            [schemaEntityKey.FILE_FOLDER_NAME, "testFolderName2"],
        ]);

        const entitiesSchemaMap = new Map<string, Map<string, string>>([
            ["webfiless", folderNameMap],
            ["webpagess", folderNameMap1],
            ["webtemplatess", folderNameMap2],
        ]);
        const result = getEntitiesFolderNameMap(entitiesSchemaMap);
        expect(result.size).eq(0);
    });
});
