/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as nls from "vscode-nls";
import Sinon, { stub, assert, spy } from "sinon";
import { expect } from "chai";
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
import powerPlatformExtensionContext from "../../../client/powerPlatformExtensionContext";
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
    it("showErrorDialog() - should call showErrorMessage", () => {
        const errorString = "this is error message";
        const detailMessage = "not able to open";
        const _mockShowErrorMessage = stub(vscode.window, "showErrorMessage");
        showErrorDialog(errorString, detailMessage);
        const options = { detail: detailMessage, modal: true };
        assert.calledOnceWithExactly(
            _mockShowErrorMessage,
            errorString,
            options
        );
    });

    it("showErrorDialog() - should call showErrorMessage with detailMessage as null", () => {
        const errorString = "this is error message";
        const _mockShowErrorMessage = stub(vscode.window, "showErrorMessage");
        showErrorDialog(errorString);
        const options = { detail: undefined, modal: true };
        assert.calledOnceWithExactly(
            _mockShowErrorMessage,
            errorString,
            options
        );
    });

    it("removeEncodingFromParameters()", () => {
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, "3A%20test_file_name"],
            [queryParameters.WEBSITE_NAME, "3A%20test_test_webSiteName"],
        ]);
        removeEncodingFromParameters(queryParamsMap);

        const websiteName = queryParamsMap.get(
            queryParameters.WEBSITE_NAME
        ) as string;

        const schemaFileName = queryParamsMap.get(
            schemaKey.SCHEMA_VERSION
        ) as string;

        expect(schemaFileName).eq("3A test_file_name");
        expect(websiteName).eq("3A test_test_webSiteName");
    });

    it("removeEncodingFromParameters() - provide website name blank", () => {
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, "3A%20test_file_name"],
            [queryParameters.WEBSITE_NAME, ""],
        ]);
        removeEncodingFromParameters(queryParamsMap);

        const websiteName = queryParamsMap.get(
            queryParameters.WEBSITE_NAME
        ) as string;

        const schemaFileName = queryParamsMap.get(
            schemaKey.SCHEMA_VERSION
        ) as string;

        expect(schemaFileName).eq("3A test_file_name");
        expect(websiteName).eq(PORTALS_FOLDER_NAME_DEFAULT);
    });
    it("checkMandatoryParameters() - should return true", () => {
        const appName = "portal";
        const entity = "entity";
        const entityId = "3";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "url"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0"],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );
        expect(result).true;
    });

    it("checkMandatoryParameters() - should return false when entity is blank", () => {
        const appName = "portal";
        const entity = "";
        const entityId = "3";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "url"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0"],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );
        expect(result).false;
    });

    it("checkMandatoryParameters() - should return false when entityId is blank", () => {
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
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );
        expect(result).false;
    });

    it("checkMandatoryParameters() - should return false when orgURL is blank", () => {
        const appName = "portal";
        const entity = "entity";
        const entityId = "3";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, ""],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0"],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );
        expect(result).false;
    });

    it("checkMandatoryParameters() - should return false when DATA_SOURCE is blank", () => {
        const appName = "portal";
        const entity = "entity";
        const entityId = "3";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "orgUrl"],
            [queryParameters.DATA_SOURCE, ""],
            [schemaKey.SCHEMA_VERSION, "1.0.0"],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );
        expect(result).false;
    });

    it("checkMandatoryParameters() - should return false when SCHEMA_VERSION is blank", () => {
        const appName = "portal";
        const entity = "entity";
        const entityId = "3";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "orgUrl"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, ""],
            [
                queryParameters.WEBSITE_ID,
                "ed9a6c19-5ab6-4f67-8c35-2423cff958c4",
            ],
        ]);
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );
        expect(result).false;
    });

    it("checkMandatoryParameters() - should return false when WEBSITE_ID is blank", () => {
        const appName = "portal";
        const entity = "entity";
        const entityId = "3";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "orgUrl"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0.0"],
            [queryParameters.WEBSITE_ID, ""],
        ]);
        const result = checkMandatoryParameters(
            appName,
            entity,
            entityId,
            queryParamsMap
        );
        expect(result).false;
    });

    it("checkMandatoryPathParameters() - should return true", () => {
        const appName = "portal";
        const entity = "entity";
        const entityId = "3";
        const result = checkMandatoryPathParameters(appName, entity, entityId);
        expect(result).true;
    });

    it("checkMandatoryPathParameters() - should return false when entity is blank", () => {
        const _mockShowErrorDialog = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            powerPlatformExtensionContext.telemetry,
            "sendErrorTelemetry"
        );
        const appName = "portal";
        const entity = "";
        const entityId = "3";
        const result = checkMandatoryPathParameters(appName, entity, entityId);
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

    it("checkMandatoryPathParameters() - should return false when entityId is blank", () => {
        const _mockShowErrorDialog = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            powerPlatformExtensionContext.telemetry,
            "sendErrorTelemetry"
        );
        const appName = "portal";
        const entity = "entity";
        const entityId = "";
        const result = checkMandatoryPathParameters(appName, entity, entityId);
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

    it("checkMandatoryPathParameters() - should return false when appName is different", () => {
        const _mockShowErrorMessage = stub(vscode.window, "showErrorMessage");
        const appName = "por";
        const entity = "entity";
        const entityId = "";
        const result = checkMandatoryPathParameters(appName, entity, entityId);
        const detailMessage = localize(
            "microsoft-powerapps-portals.webExtension.init.app-not-found",
            "Unable to find that app"
        );
        expect(result).false;
        assert.calledWith(_mockShowErrorMessage, detailMessage);
        assert.calledOnce(_mockShowErrorMessage);
    });

    it("checkMandatoryQueryParameters() - should return true", () => {
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
        const result = checkMandatoryQueryParameters(appName, queryParamsMap);
        expect(result).true;
    });

    it("checkMandatoryQueryParameters() - should return false when ORG_URL is blank", () => {
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
        const result = checkMandatoryQueryParameters(appName, queryParamsMap);
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

    it("checkMandatoryQueryParameters() - should return false when DATA_SOURCE is blank", () => {
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
        const result = checkMandatoryQueryParameters(appName, queryParamsMap);
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

    it("checkMandatoryQueryParameters() - should return false when SCHEMA_VERSION is blank", () => {
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
        const result = checkMandatoryQueryParameters(appName, queryParamsMap);
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

    it("checkMandatoryQueryParameters() - should return false when WEBSITE_ID is blank", () => {
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
        const result = checkMandatoryQueryParameters(appName, queryParamsMap);
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

    it("checkMandatoryQueryParameters() - should return false when appName is not portal", () => {
        const _mockShowErrorMessage = spy(vscode.window, "showErrorMessage");
        const appName = "por";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "ORG_URL"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0.0"],
            [queryParameters.WEBSITE_ID, "12345"],
        ]);
        const result = checkMandatoryQueryParameters(appName, queryParamsMap);
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
