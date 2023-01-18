/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import sinon from "sinon";
import { expect } from "chai";
import WebExtensionContext from "../../WebExtensionContext";
import { schemaKey, schemaEntityKey } from "../../schema/constants";
import * as portalSchemaReader from "../../schema/portalSchemaReader";
import * as Constants from "../../common/constants";

describe("WebExtensionContext", () => {
    afterEach(() => {
        sinon.restore();
    });
    it("setWebExtensionContext", () => {
        //Act
        const entityName = "webPages";
        const entityId = "3355d5ec-b38d-46ca-a150-c00386b0a4be";
        const queryParamsMap = new Map<string, string>([
            ["_fetchQueryParameters", schemaEntityKey.FETCH_QUERY_PARAMETERS],
            [schemaEntityKey.DATAVERSE_ENTITY_NAME, "DATAVERSE_ENTITY_NAME"],
            [schemaKey.SCHEMA_VERSION, "1.1"],
            [schemaKey.DATA, "schemaKey.DATA"],
            [schemaKey.DATAVERSE_API_VERSION, "1.0"],
            [Constants.queryParameters.WEBSITE_NAME, "powerPages"],
        ]);

        const entityMap = new Map<string, string>([["test", "Entity"]]);

        const entitiesSchemaMap = new Map<string, Map<string, string>>([
            [entityName, entityMap],
        ]);

        const dataSourcePropertiesMap = new Map<string, string>([
            [schemaKey.SINGLE_ENTITY_URL, schemaKey.SINGLE_ENTITY_URL],
        ]);

        sinon
            .stub(portalSchemaReader, "getDataSourcePropertiesMap")
            .returns(dataSourcePropertiesMap);

        const entitiesFolderNameMap = new Map<string, string>([
            [schemaKey.SINGLE_ENTITY_URL, schemaKey.SINGLE_ENTITY_URL],
        ]);
        sinon
            .stub(portalSchemaReader, "getEntitiesFolderNameMap")
            .returns(entitiesFolderNameMap);

        sinon
            .stub(portalSchemaReader, "getEntitiesSchemaMap")
            .returns(entitiesSchemaMap);
        const fileUri: vscode.Uri = { path: "testuri" } as vscode.Uri;
        sinon.stub(vscode.Uri, "parse").returns(fileUri);

        //Action
        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );

        //Assert

        expect(WebExtensionContext.currentSchemaVersion).eq("1.1");
        expect(WebExtensionContext.defaultEntityType).eq(
            entityName.toLowerCase()
        );
        expect(WebExtensionContext.defaultEntityId).eq(entityId);
        expect(WebExtensionContext.urlParametersMap).eq(queryParamsMap);
        expect(WebExtensionContext.schemaEntitiesMap).eq(entitiesSchemaMap);
        expect(WebExtensionContext.schemaDataSourcePropertiesMap).eq(
            dataSourcePropertiesMap
        );
        expect(WebExtensionContext.entitiesFolderNameMap).eq(
            entitiesFolderNameMap
        );
        expect(WebExtensionContext.isContextSet).eq(true);
        expect(WebExtensionContext.rootDirectory).eq(fileUri);
    });
});
