/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import { getFolderSubUris, getRequestUrlForEntities } from "../../utilities/folderHelperUtility";
import WebExtensionContext from "../../WebExtensionContext";
import { schemaEntityName } from "../../schema/constants";

describe("folderHelperUtility", () => {
    afterEach(() => {
        sinon.restore();
    });

    it("getFolderSubUris_shouldSkipConditionalFolderEntities", () => {
        // Arrange
        const mockSchemaMap = new Map();
        mockSchemaMap.set(schemaEntityName.WEBPAGES, new Map([["_foldername", "web-pages"]]));
        mockSchemaMap.set(schemaEntityName.BLOGS, new Map([["_foldername", "blogs"]]));
        mockSchemaMap.set(schemaEntityName.WEBFILES, new Map([["_foldername", "web-files"]]));

        sinon.stub(WebExtensionContext, "schemaEntitiesMap").get(() => mockSchemaMap);

        // Act
        const result = getFolderSubUris();

        // Assert
        expect(result).to.include("web-pages");
        expect(result).to.include("web-files");
        expect(result).to.not.include("blogs");
    });

    it("getRequestUrlForEntities_shouldSkipConditionalFolderEntities", () => {
        // Arrange
        const mockSchemaMap = new Map();
        mockSchemaMap.set(schemaEntityName.WEBPAGES, new Map([
            ["_foldername", "web-pages"],
            ["_vscodeentityname", "webpages"]
        ]));
        mockSchemaMap.set(schemaEntityName.BLOGS, new Map([
            ["_foldername", "blogs"],
            ["_vscodeentityname", "blogs"]
        ]));

        sinon.stub(WebExtensionContext, "schemaEntitiesMap").get(() => mockSchemaMap);
        sinon.stub(WebExtensionContext, "showMultifileInVSCode").get(() => true);
        sinon.stub(WebExtensionContext, "urlParametersMap").get(() => new Map([["orgUrl", "https://test.crm.dynamics.com"]]));

        // Act
        const result = getRequestUrlForEntities();

        // Assert
        const entityNames = result.map(r => r.entityName);
        expect(entityNames).to.include(schemaEntityName.WEBPAGES);
        expect(entityNames).to.not.include(schemaEntityName.BLOGS);
    });
});
