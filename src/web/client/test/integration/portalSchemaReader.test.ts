/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as portalSchema from "../../schema/portalSchema";
import { schemaEntityKey } from "../../schema/constants";
import Sinon from "sinon";
import {
    getEntitiesSchemaMap,
    getDataSourcePropertiesMap,
    getEntitiesFolderNameMap,
} from "../../schema/portalSchemaReader";
import { expect, assert } from "chai";

describe("portalSchemaReader", () => {
    afterEach(() => {
        Sinon.restore();
    });
    it("getEntitiesSchemaMap_withValidSchemaV2_shouldBeMap", () => {
        //Action
        const result = getEntitiesSchemaMap(
            portalSchema.portal_schema_V2.entities.dataSourceProperties
                .schema
        );

        //Assert
        portalSchema.portal_schema_V2.entities.entity.forEach(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (element: any) => {
                const entitiesDetailsMap = result.get(
                    element._vscodeentityname
                );
                if (entitiesDetailsMap) {
                    for (const [key, value] of entitiesDetailsMap) {
                        assert.deepStrictEqual(value, element[key]);
                    }
                } else {
                    expect.fail();
                }
            }
        );
    });

    it("getEntitiesSchemaMap_withValidSchemaV1_shouldBeMap", () => {
        //Action
        const result = getEntitiesSchemaMap("test");
        //Assert
        portalSchema.portal_schema_V1.entities.entity.forEach(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (element: any) => {
                const entitiesDetailsMap = result.get(
                    element._vscodeentityname
                );
                if (entitiesDetailsMap) {
                    for (const [key, value] of entitiesDetailsMap) {
                        assert.deepStrictEqual(value, element[key]);
                    }
                } else {
                    expect.fail();
                }
            }
        );
    });

    it("getDataSourcePropertiesMap_withValidSchemaV2_shouldBeMap", () => {
        //Action
        const dataSourceProperties = {
            api: "api",
            data: "data",
            version: "v9.2",
            schema: "portalschemav2",
            singleEntityURL:
                "{dataverseOrgUrl}/{api}/{data}/{version}/{entity}({entityId})",
            multiEntityURL: "{dataverseOrgUrl}/{api}/{data}/{version}/{entity}",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
        const result = getDataSourcePropertiesMap(
            portalSchema.portal_schema_V2.entities.dataSourceProperties
                .schema
        );

        //Assert
        for (const key in dataSourceProperties) {
            expect(result.get(key)).eq(dataSourceProperties[key]);
        }
    });

    it("getDataSourcePropertiesMap_withValidSchemaV1_shouldBeMap", () => {
        //Action

        const dataSourceProperties = {
            api: "api",
            data: "data",
            version: "v9.2",
            schema: "portalschemav1",
            singleEntityURL:
                "{dataverseOrgUrl}/{api}/{data}/{version}/{entity}({entityId})",
            multiEntityURL: "{dataverseOrgUrl}/{api}/{data}/{version}/{entity}",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        const result = getDataSourcePropertiesMap("test");

        //Assert
        for (const key in dataSourceProperties) {
            expect(result.get(key)).eq(dataSourceProperties[key]);
        }
    });

    it("getEntitiesFolderNameMap_withValidEntitiesSchema_shouldBeMap", () => {
        //Act
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

        //Action
        const result = getEntitiesFolderNameMap(entitiesSchemaMap);

        //Assert
        expect(result?.get("webfiles")).equal("testFolderName");
        expect(result?.get("webpages")).equal("testFolderName1");
        expect(result?.get("webtemplates")).equal("testFolderName2");
    });

    it("getEntitiesFolderNameMap_withDifferentSchemaEntityKey_shouldNotBeMap", () => {
        //Act
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

        //Action
        const result = getEntitiesFolderNameMap(entitiesSchemaMap);

        //Assert
        expect(result.size).eq(0);
    });

    it("getEntitiesFolderNameMap_withDifferentEntitiesSchemaMapKey_shouldNotBeMap", () => {
        //Act
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

        //Action
        const result = getEntitiesFolderNameMap(entitiesSchemaMap);

        //Assert
        expect(result.size).eq(0);
    });
});
