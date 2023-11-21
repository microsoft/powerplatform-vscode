/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import Sinon, { stub, assert, spy } from "sinon";
import { expect } from "chai";
import WebExtensionContext from "../../../client/WebExtensionContext";
import { schemaKey } from "../../schema/constants";
import { telemetryEventNames } from "../../telemetry/constants";

import {
    queryParameters,
    PORTALS_FOLDER_NAME_DEFAULT,
} from "../../common/constants";

import {
    showErrorDialog,
    removeEncodingFromParameters,
    checkMandatoryParameters,
    checkMandatoryPathParameters,
    checkMandatoryQueryParameters,
} from "../../common/errorHandler";

describe("errorHandler", () => {
    afterEach(() => {
        Sinon.restore();
    });

    it("showErrorDialog_whenDetailMessageAndErrorStringPassed_shouldCallShowErrorMessage", () => {
        //Act
        const errorString = "this is error message";
        const detailMessage = "not able to open";
        const _mockShowErrorMessage = stub(vscode.window, "showErrorMessage");

        //Action
        showErrorDialog(errorString, detailMessage);

        //Assert
        const options = { detail: detailMessage, modal: true };
        assert.calledOnceWithExactly(
            _mockShowErrorMessage,
            errorString,
            options
        );
    });

    it("showErrorDialog_whenDetailMessagesIsNotPassed_shouldCallShowErrorMessage", () => {
        //Act
        const errorString = "this is error message";
        const _mockShowErrorMessage = stub(vscode.window, "showErrorMessage");

        //Action
        showErrorDialog(errorString);

        //Assert
        const options = { detail: undefined, modal: true };
        assert.calledOnceWithExactly(
            _mockShowErrorMessage,
            errorString,
            options
        );
    });

    it("removeEncodingFromParameters_whenEncodedStrginPassed_shouldDecodeSCHEMAVERSIONAndWEBSITENAME", () => {
        //Act
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, "3A%20test_file_name"],
            [queryParameters.WEBSITE_NAME, "3A%20test_test_webSiteName"],
        ]);

        //Action
        removeEncodingFromParameters(queryParamsMap);

        //Assert
        const websiteName = queryParamsMap.get(
            queryParameters.WEBSITE_NAME
        ) as string;

        const schemaFileName = queryParamsMap.get(
            schemaKey.SCHEMA_VERSION
        ) as string;

        expect(schemaFileName).eq("3A test_file_name");
        expect(websiteName).eq("3A test_test_webSiteName");
    });

    it("removeEncodingFromParameters__whenWebsiteNameIsBlank_shouldMapPORTALSFOLDERNAMEDEFAULT", () => {
        //Act
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, "3A%20test_file_name"],
            [queryParameters.WEBSITE_NAME, ""],
        ]);
        const portalFolderName = PORTALS_FOLDER_NAME_DEFAULT;

        //Action
        removeEncodingFromParameters(queryParamsMap);

        //Assert
        const websiteName = queryParamsMap.get(
            queryParameters.WEBSITE_NAME
        ) as string;

        const schemaFileName = queryParamsMap.get(
            schemaKey.SCHEMA_VERSION
        ) as string;

        expect(schemaFileName).eq("3A test_file_name");
        expect(websiteName).eq(portalFolderName);
    });

    it("checkMandatoryParameters_whenAppNameIsPortalAndEntityAndEntityIdHavingValues_shouldReturnTrue", () => {
        //Act
        const appName = "portal";
        const entity = "entity";
        const entityId = "512e50bd-a9d1-44c0-ba3f-5dc7f46e7216";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "url"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0"],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);

        //Action
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );

        //Assert
        expect(result).true;
    });

    it("checkMandatoryParameters_whenEntityPassedAsBlank_shouldReturnFalse", () => {
        //Act
        const appName = "portal";
        const entity = "";
        const entityId = "512e50bd-a9d1-44c0-ba3f-5dc7f46e7216";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "url"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0"],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);

        //Action
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );

        //Assert
        expect(result).false;
    });

    it("checkMandatoryParameters_whenEntityIdPassedAsBlank_shouldReturnFalse", () => {
        //Act
        const appName = "portal";
        const entity = "entity";
        const entityId = "";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "url"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0"],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);

        //Action
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );

        //Assert
        expect(result).false;
    });

    it("checkMandatoryParameters_whenAppNameIsDifferentFromPortal_shouldReturnFalse", () => {
        //Act
        const _mockShowErrorMessage = stub(vscode.window, "showErrorMessage");
        const appName = "por";
        const entity = "entity";
        const entityId = "512e50bd-a9d1-44c0-ba3f-5dc7f46e7216";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "url"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0"],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);
        //Action
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );
        //Assert
        const detailMessage = { detail: vscode.l10n.t("Unable to find that app"), modal: true };
        const errorString = vscode.l10n.t("There was a problem opening the workspace");
        expect(result).false;
        assert.calledWith(_mockShowErrorMessage, errorString, detailMessage);
        assert.calledOnce(_mockShowErrorMessage);
    });

    it("checkMandatoryParameters_whenOrgURLIsBlank_shouldReturnFalse", () => {
        //Act
        const appName = "portal";
        const entity = "entity";
        const entityId = "512e50bd-a9d1-44c0-ba3f-5dc7f46e7216";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, ""],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0"],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);
        //Action
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );
        //Assert
        expect(result).false;
    });

    it("checkMandatoryParameters_whenDATASOURCEIsBlank_shouldReturnFalse", () => {
        //Act
        const appName = "portal";
        const entity = "entity";
        const entityId = "512e50bd-a9d1-44c0-ba3f-5dc7f46e7216";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "orgUrl"],
            [queryParameters.DATA_SOURCE, ""],
            [schemaKey.SCHEMA_VERSION, "1.0.0"],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);

        //Action
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );

        //Assert
        expect(result).false;
    });

    it("checkMandatoryParameters_whenSCHEMAVERSIONIsBlank_shouldReturnFalse", () => {
        //Act
        const appName = "portal";
        const entity = "entity";
        const entityId = "512e50bd-a9d1-44c0-ba3f-5dc7f46e7216";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "orgUrl"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, ""],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);

        //Action
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );

        //Assert
        expect(result).false;
    });

    it("checkMandatoryParameters_whenWEBSITEIDIsBlank_shouldReturnFalse", () => {
        //Act
        const appName = "portal";
        const entity = "entity";
        const entityId = "512e50bd-a9d1-44c0-ba3f-5dc7f46e7216";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "orgUrl"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0.0"],
            [queryParameters.WEBSITE_ID, ""],
        ]);

        //Action
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );

        //Assert
        expect(result).false;
    });

    it("checkMandatoryPathParameters_whenEveryParameterIsPassedOrValid_shouldReturnTrue", () => {
        //Act
        const appName = "portal";
        const entity = "entity";
        const entityId = "512e50bd-a9d1-44c0-ba3f-5dc7f46e7216";
        //Action
        const result = checkMandatoryPathParameters(appName, entity, entityId);
        //Assert
        expect(result).true;
    });

    it("checkMandatoryPathParameters_whenEntityIsBlank_shouldReturnFalse", () => {
        //Act
        const _mockShowErrorDialog = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );
        const appName = "portal";
        const entity = "";
        const entityId = "512e50bd-a9d1-44c0-ba3f-5dc7f46e7216";
        //Action
        const result = checkMandatoryPathParameters(appName, entity, entityId);
        //Assert
        const detailMessage = vscode.l10n.t("Check the URL and verify the parameters are correct");
        const options = { detail: detailMessage, modal: true };
        expect(result).false;
        assert.calledOnceWithExactly(
            _mockShowErrorDialog,
            vscode.l10n.t("There was a problem opening the workspace"),
            options
        );
        assert.calledOnceWithExactly(
            _mockSendErrorTelemetry,
            telemetryEventNames.WEB_EXTENSION_MANDATORY_PATH_PARAMETERS_MISSING,
            checkMandatoryPathParameters.name,
            `entity:, entityId:512e50bd-a9d1-44c0-ba3f-5dc7f46e7216`,

        );
    });

    it("checkMandatoryPathParameters_whenEntityIdIsBlank_shouldReturnFalse", () => {
        //Act
        const _mockShowErrorDialog = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );
        const appName = "portal";
        const entity = "entity";
        const entityId = "";
        //Action
        const result = checkMandatoryPathParameters(appName, entity, entityId);
        //Assert
        const detailMessage = vscode.l10n.t("Check the URL and verify the parameters are correct");
        const options = { detail: detailMessage, modal: true };
        expect(result).false;
        assert.calledOnceWithExactly(
            _mockShowErrorDialog,
            vscode.l10n.t("There was a problem opening the workspace"),
            options
        );
        assert.calledOnceWithExactly(
            _mockSendErrorTelemetry,
            telemetryEventNames.WEB_EXTENSION_MANDATORY_PATH_PARAMETERS_MISSING,
            checkMandatoryPathParameters.name,
            `entity:entity, entityId:`
        );
    });

    it("checkMandatoryPathParameters_whenPppNameIsDifferentFromPortal_shouldReturnFalse", () => {
        //Act
        const _mockShowErrorMessage = stub(vscode.window, "showErrorMessage");
        const appName = "por";
        const entity = "entity";
        const entityId = "";
        //Action
        const result = checkMandatoryPathParameters(appName, entity, entityId);
        //Assert
        const detailMessage = { detail: vscode.l10n.t("Unable to find that app"), modal: true };
        const errorString = vscode.l10n.t("There was a problem opening the workspace");
        expect(result).false;
        assert.calledWith(_mockShowErrorMessage, errorString, detailMessage);
        assert.calledOnce(_mockShowErrorMessage);
    });

    it("checkMandatoryQueryParameters_whenAllParameterIsPassedAndValid_shouldReturnTrue", () => {
        //Act
        const appName = "portal";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "orgUrl"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0.0"],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);
        //Action
        const result = checkMandatoryQueryParameters(appName, queryParamsMap);
        //Assert
        expect(result).true;
    });

    it("checkMandatoryQueryParameters_whenOrgUrlIsBlank_shouldReturnFalse", () => {
        //Act
        const _mockShowErrorMessage = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );

        const appName = "portal";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, ""],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0.0"],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);
        //Action
        const result = checkMandatoryQueryParameters(appName, queryParamsMap);
        //Assert
        expect(result).false;
        const detailMessage = vscode.l10n.t("Check the URL and verify the parameters are correct");

        const errorString = vscode.l10n.t("There was a problem opening the workspace");
        const options = { detail: detailMessage, modal: true };

        assert.calledOnceWithExactly(
            _mockShowErrorMessage,
            errorString,
            options
        );
        assert.calledOnceWithExactly(
            _mockSendErrorTelemetry,
            telemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING,
            checkMandatoryQueryParameters.name,
            `orgURL:, dataSource:SQL, schemaName:1.0.0.0 ,websiteId:ed9a6c19-5ab6-4f67-8c35-2423cff958c4`
        );
    });

    it("checkMandatoryQueryParameters_whenDataSourceIsBlank_shouldReturnFalse", () => {
        //Act
        const _mockShowErrorMessage = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );
        const appName = "portal";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "ORG_URL"],
            [queryParameters.DATA_SOURCE, ""],
            [schemaKey.SCHEMA_VERSION, "1.0.0.0"],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);
        //Action
        const result = checkMandatoryQueryParameters(appName, queryParamsMap);
        //Assert
        expect(result).false;
        const detailMessage = vscode.l10n.t("Check the URL and verify the parameters are correct");

        const errorString = vscode.l10n.t("There was a problem opening the workspace");
        const options = { detail: detailMessage, modal: true };

        assert.calledOnceWithExactly(
            _mockShowErrorMessage,
            errorString,
            options
        );
        assert.calledOnceWithExactly(
            _mockSendErrorTelemetry,
            telemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING,
            checkMandatoryQueryParameters.name,
            `orgURL:ORG_URL, dataSource:, schemaName:1.0.0.0 ,websiteId:ed9a6c19-5ab6-4f67-8c35-2423cff958c4`
        );
    });

    it("checkMandatoryQueryParameters_whenSchemaVersionIsBlank_shouldReturnFalse", () => {
        //Act
        const _mockShowErrorMessage = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );
        const appName = "portal";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "ORG_URL"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, ""],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);
        //Action
        const result = checkMandatoryQueryParameters(appName, queryParamsMap);
        //Assert
        expect(result).false;
        const detailMessage = vscode.l10n.t("Check the URL and verify the parameters are correct");

        const errorString = vscode.l10n.t("There was a problem opening the workspace");
        const options = { detail: detailMessage, modal: true };

        assert.calledOnceWithExactly(
            _mockShowErrorMessage,
            errorString,
            options
        );
        assert.calledOnceWithExactly(
            _mockSendErrorTelemetry,
            telemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING,
            checkMandatoryQueryParameters.name,
            `orgURL:ORG_URL, dataSource:SQL, schemaName: ,websiteId:ed9a6c19-5ab6-4f67-8c35-2423cff958c4`
        );
    });

    it("checkMandatoryQueryParameters_whenWebsiteIdIsBlank_shouldReturnFalse", () => {
        //Act
        const _mockShowErrorMessage = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );
        const appName = "portal";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "ORG_URL"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0.0"],
            [queryParameters.WEBSITE_ID, ""],
        ]);
        //Action
        const result = checkMandatoryQueryParameters(appName, queryParamsMap);
        //Assert
        expect(result).false;
        const detailMessage = vscode.l10n.t("Check the URL and verify the parameters are correct");

        const errorString = vscode.l10n.t("There was a problem opening the workspace");
        const options = { detail: detailMessage, modal: true };

        assert.calledOnceWithExactly(
            _mockShowErrorMessage,
            errorString,
            options
        );
        assert.calledOnceWithExactly(
            _mockSendErrorTelemetry,
            telemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING,
            checkMandatoryQueryParameters.name,
            `orgURL:ORG_URL, dataSource:SQL, schemaName:1.0.0.0 ,websiteId:`
        );
    });

    it("checkMandatoryQueryParameters_whenAppNameIsNotPortal_shouldReturnFalse", () => {
        //Act
        const _mockShowErrorMessage = spy(vscode.window, "showErrorMessage");
        const appName = "por";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "ORG_URL"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0.0"],
            [queryParameters.WEBSITE_ID, "12345"],
        ]);
        //Action
        const detailMessage = { detail: vscode.l10n.t("Unable to find that app"), modal: true };
        const errorString = vscode.l10n.t("There was a problem opening the workspace");
        const result = checkMandatoryQueryParameters(appName, queryParamsMap);
        //Assert
        expect(result).false;
        assert.calledOnce(_mockShowErrorMessage);
        assert.calledWith(
            _mockShowErrorMessage,
            errorString,
            detailMessage
        );
    });
});
