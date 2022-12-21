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
    it("getEntitiesSchemaMap", () => {
        stub(schemaHelperUtil, "getPortalSchema").returns(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            portalSchemaReadeMock.schema_data as any
        );

        const result = getEntitiesSchemaMap("testSchema");
        for (const [key] of result) {
            expect(key).equal("websites");
        }
        const websitesData = result.get("websites");
        expect(websitesData?.get("_vscodeentityname")).equal("websites");
        expect(websitesData?.get("_dataverseenityname")).equal(
            "powerpagesites"
        );
        expect(websitesData?.get("_displayname")).equal("Website");
    });

    it("getEntitiesSchemaMap() - empty entity", () => {
        stub(schemaHelperUtil, "getPortalSchema").returns(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            portalSchemaReadeMock.schema_data_with_empty_array as any
        );

        const result = getEntitiesSchemaMap("testSchema");
        for (const [key] of result) {
            expect(key).equal(undefined);
        }
    });

    it("getDataSourcePropertiesMap()", () => {
        stub(schemaHelperUtil, "getPortalSchema").returns(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            portalSchemaReadeMock.schema_data as any
        );
        const result = getDataSourcePropertiesMap("testSchema");
        expect(result?.get("api")).equal("api");
        expect(result?.get("data")).equal("data");
        expect(result?.get("version")).equal("v9.2");
    });

    it("getEntitiesFolderNameMap()", () => {
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

    it("getEntitiesFolderNameMap() -  without folder name", () => {
        const folderNameMap = new Map<string, string>([
            [schemaEntityKey.ATTRIBUTES, "testFolderName"],
        ]);

        const folderNameMap1 = new Map<string, string>([
            [schemaEntityKey.DATAVERSE_ENTITY_NAME, "testFolderName1"],
        ]);

        const folderNameMap2 = new Map<string, string>([
            [schemaEntityKey.DATAVERSE_ENTITY_NAME, "testFolderName2"],
        ]);

        const entitiesSchemaMap = new Map<string, Map<string, string>>([
            ["webfiles", folderNameMap],
            ["webpages", folderNameMap1],
            ["webtemplates", folderNameMap2],
        ]);
        const result = getEntitiesFolderNameMap(entitiesSchemaMap);
        expect(result.size).eq(0);
    });

    it("getEntitiesFolderNameMap() - does not have same entity", () => {
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
