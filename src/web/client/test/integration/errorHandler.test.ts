/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as nls from "vscode-nls";
import Sinon, { stub, assert, spy } from "sinon";
import { expect } from "chai";
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
import powerPlatformExtensionContext from "../../../client/WebExtensionContext";
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

    it("showErrorDialog_shouldCallShowErrorMessage_whenDetailMessageAndErrorString", () => {
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

    it("showErrorDialog_shouldCallShowErrorMessage_whenDetailMessagesIsNotPassed", () => {
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

    it("removeEncodingFromParameters_shouldDecodeSCHEMAVERSIONAndWEBSITENAME", () => {
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

    it("removeEncodingFromParameters_shouldMapPORTALSFOLDERNAMEDEFAULT_whenWebsiteNameIsBlank_", () => {
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

    it("checkMandatoryParameters_shouldReturnTrue_whenAppNameIsPortalAndEntityAndEntityIdHavingValues", () => {
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

    it("checkMandatoryParameters_shouldReturnFalseWhenEntityIsBlank", () => {
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

    it("checkMandatoryParameters_shouldReturnFalseWhenEntityIdIsBlank", () => {
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

    it("checkMandatoryParameters_shouldReturnFalseWhenAppNameIsDifferentFromPortal", () => {
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
        const detailMessage = localize(
            "microsoft-powerapps-portals.webExtension.init.app-not-found",
            "Unable to find that app"
        );
        expect(result).false;
        assert.calledWith(_mockShowErrorMessage, detailMessage);
        assert.calledOnce(_mockShowErrorMessage);
    });

    it("checkMandatoryParameters_shouldReturnFalseWhenOrgURLIsBlank", () => {
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

    it("checkMandatoryParameters_shouldReturnFalseWhenDATASOURCEIsBlank", () => {
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

    it("checkMandatoryParameters_shouldReturnFalseWhenSCHEMAVERSIONIsBlank", () => {
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

    it("checkMandatoryParameters_shouldReturnFalseWhenWEBSITEIDIsBlank", () => {
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

    it("checkMandatoryPathParameters_shouldReturnTrueWhenEveryParameterIsPassedOrValid", () => {
        //Act
        const appName = "portal";
        const entity = "entity";
        const entityId = "512e50bd-a9d1-44c0-ba3f-5dc7f46e7216";
        //Action
        const result = checkMandatoryPathParameters(appName, entity, entityId);
        //Assert
        expect(result).true;
    });

    it("checkMandatoryPathParameters_shouldReturnFalseWhenEntityIsBlank", () => {
        //Act
        const _mockShowErrorDialog = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            powerPlatformExtensionContext.telemetry,
            "sendErrorTelemetry"
        );
        const appName = "portal";
        const entity = "";
        const entityId = "512e50bd-a9d1-44c0-ba3f-5dc7f46e7216";
        //Action
        const result = checkMandatoryPathParameters(appName, entity, entityId);
        //Assert
        const detailMessage = localize(
            "microsoft-powerapps-portals.webExtension.init.workspace.error.desc",
            "Check the URL and verify the parameters are correct"
        );
        const options = { detail: detailMessage, modal: true };
        expect(result).false;
        assert.calledOnceWithExactly(
            _mockShowErrorDialog,
            localize(
                "microsoft-powerapps-portals.webExtension.init.workspace.error",
                "There was a problem opening the workspace"
            ),
            options
        );
        assert.calledOnceWithExactly(
            _mockSendErrorTelemetry,
            telemetryEventNames.WEB_EXTENSION_MANDATORY_PATH_PARAMETERS_MISSING
        );
    });

    it("checkMandatoryPathParameters_shouldReturnFalseWhenEntityIdIsBlank", () => {
        //Act
        const _mockShowErrorDialog = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            powerPlatformExtensionContext.telemetry,
            "sendErrorTelemetry"
        );
        const appName = "portal";
        const entity = "entity";
        const entityId = "";
        //Action
        const result = checkMandatoryPathParameters(appName, entity, entityId);
        //Assert
        const detailMessage = localize(
            "microsoft-powerapps-portals.webExtension.init.workspace.error.desc",
            "Check the URL and verify the parameters are correct"
        );
        const options = { detail: detailMessage, modal: true };
        expect(result).false;
        assert.calledOnceWithExactly(
            _mockShowErrorDialog,
            localize(
                "microsoft-powerapps-portals.webExtension.init.workspace.error",
                "There was a problem opening the workspace"
            ),
            options
        );
        assert.calledOnceWithExactly(
            _mockSendErrorTelemetry,
            telemetryEventNames.WEB_EXTENSION_MANDATORY_PATH_PARAMETERS_MISSING
        );
    });

    it("checkMandatoryPathParameters_shouldReturnFalseWhenPppNameIsDifferentFromPortal", () => {
        //Act
        const _mockShowErrorMessage = stub(vscode.window, "showErrorMessage");
        const appName = "por";
        const entity = "entity";
        const entityId = "";
        //Action
        const result = checkMandatoryPathParameters(appName, entity, entityId);
        //Assert
        const detailMessage = localize(
            "microsoft-powerapps-portals.webExtension.init.app-not-found",
            "Unable to find that app"
        );
        expect(result).false;
        assert.calledWith(_mockShowErrorMessage, detailMessage);
        assert.calledOnce(_mockShowErrorMessage);
    });

    it("checkMandatoryQueryParameters__shouldReturnTrueWhenAllParameterIsPassedAndValid", () => {
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

    it("checkMandatoryQueryParameters_shouldReturnFalseWhenORGURLIsBlank", () => {
        //Act
        const _mockShowErrorMessage = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            powerPlatformExtensionContext.telemetry,
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
        const detailMessage = localize(
            "microsoft-powerapps-portals.webExtension.parameter.desc",
            "Check the URL and verify the parameters are correct"
        );

        const errorString = localize(
            "microsoft-powerapps-portals.webExtension.parameter.error",
            "There was a problem opening the workspace"
        );
        const options = { detail: detailMessage, modal: true };

        assert.calledOnceWithExactly(
            _mockShowErrorMessage,
            errorString,
            options
        );
        assert.calledOnceWithExactly(
            _mockSendErrorTelemetry,
            telemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING
        );
    });

    it("checkMandatoryQueryParameters_shouldReturnFalseWhenDATASOURCEIsBlank", () => {
        //Act
        const _mockShowErrorMessage = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            powerPlatformExtensionContext.telemetry,
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
        const detailMessage = localize(
            "microsoft-powerapps-portals.webExtension.parameter.desc",
            "Check the URL and verify the parameters are correct"
        );

        const errorString = localize(
            "microsoft-powerapps-portals.webExtension.parameter.error",
            "There was a problem opening the workspace"
        );
        const options = { detail: detailMessage, modal: true };

        assert.calledOnceWithExactly(
            _mockShowErrorMessage,
            errorString,
            options
        );
        assert.calledOnceWithExactly(
            _mockSendErrorTelemetry,
            telemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING
        );
    });

    it("checkMandatoryQueryParameters_shouldReturnFalseWhenSCHEMAVERSIONIsBlank", () => {
        //Act
        const _mockShowErrorMessage = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            powerPlatformExtensionContext.telemetry,
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
        const detailMessage = localize(
            "microsoft-powerapps-portals.webExtension.parameter.desc",
            "Check the URL and verify the parameters are correct"
        );

        const errorString = localize(
            "microsoft-powerapps-portals.webExtension.parameter.error",
            "There was a problem opening the workspace"
        );
        const options = { detail: detailMessage, modal: true };

        assert.calledOnceWithExactly(
            _mockShowErrorMessage,
            errorString,
            options
        );
        assert.calledOnceWithExactly(
            _mockSendErrorTelemetry,
            telemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING
        );
    });

    it("checkMandatoryQueryParameters_shouldReturnFalseWhenWEBSITEIDIsBlank", () => {
        //Act
        const _mockShowErrorMessage = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            powerPlatformExtensionContext.telemetry,
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
        const detailMessage = localize(
            "microsoft-powerapps-portals.webExtension.parameter.desc",
            "Check the URL and verify the parameters are correct"
        );

        const errorString = localize(
            "microsoft-powerapps-portals.webExtension.parameter.error",
            "There was a problem opening the workspace"
        );
        const options = { detail: detailMessage, modal: true };

        assert.calledOnceWithExactly(
            _mockShowErrorMessage,
            errorString,
            options
        );
        assert.calledOnceWithExactly(
            _mockSendErrorTelemetry,
            telemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING
        );
    });

    it("checkMandatoryQueryParameters_shouldReturnFalseWhenAppNameIsNotPortal", () => {
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
        const result = checkMandatoryQueryParameters(appName, queryParamsMap);
        //Assert
        expect(result).false;
        assert.calledOnce(_mockShowErrorMessage);
        assert.calledWith(
            _mockShowErrorMessage,
            localize(
                "microsoft-powerapps-portals.webExtension.init.app-not-found",
                "Unable to find that app"
            )
        );
    });
});
