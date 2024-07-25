/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import Sinon, { stub, assert, spy } from "sinon";
import { expect } from "chai";
import WebExtensionContext from "../../../client/WebExtensionContext";
import { schemaKey } from "../../schema/constants";
import { webExtensionTelemetryEventNames } from "../../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";

import {
    queryParameters,
    PORTALS_FOLDER_NAME_DEFAULT,
} from "../../common/constants";

import {
    removeEncodingFromParameters,
    checkMandatoryParameters,
    checkMandatoryPathParameters,
    checkMandatoryQueryParameters,
    isDynamicsCRMUrl,
} from "../../common/errorHandler";
import {
    showErrorDialog
} from "../../../../common/utilities/errorHandlerUtil";

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
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "https://org.crm4.dynamics.com"],
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
            queryParamsMap
        );

        //Assert
        expect(result).true;
    });

    it("checkMandatoryParameters_whenAppNameIsDifferentFromPortal_shouldReturnFalse", () => {
        //Act
        const _mockShowErrorMessage = stub(vscode.window, "showErrorMessage");
        const appName = "por";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "https://org.crm.dynamics.com"],
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
            queryParamsMap
        );
        //Assert
        expect(result).false;
    });

    it("checkMandatoryParameters_whenDATASOURCEIsBlank_shouldReturnFalse", () => {
        //Act
        const appName = "portal";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "https://org.crm2.dynamics.com"],
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
            queryParamsMap
        );

        //Assert
        expect(result).false;
    });

    it("checkMandatoryParameters_whenSCHEMAVERSIONIsBlank_shouldReturnFalse", () => {
        //Act
        const appName = "portal";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "https://org.crm11.dynamics.com"],
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
            queryParamsMap
        );

        //Assert
        expect(result).false;
    });

    it("checkMandatoryParameters_whenWEBSITEIDIsBlank_shouldReturnFalse", () => {
        //Act
        const appName = "portal";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "https://org.crm20.dynamics.com"],
            [queryParameters.DATA_SOURCE, "SQL"],
            [schemaKey.SCHEMA_VERSION, "1.0.0.0"],
            [queryParameters.WEBSITE_ID, ""],
        ]);

        //Action
        const result = checkMandatoryParameters(
            appName,
            queryParamsMap
        );

        //Assert
        expect(result).false;
    });

    it("checkMandatoryPathParameters_whenEveryParameterIsPassedOrValid_shouldReturnTrue", () => {
        //Act
        const appName = "portal";
        //Action
        const result = checkMandatoryPathParameters(appName);
        //Assert
        expect(result).true;
    });

    it("checkMandatoryPathParameters_whenPpNameIsDifferentFromPortal_shouldReturnFalse", () => {
        //Act
        const _mockShowErrorMessage = stub(vscode.window, "showErrorMessage");
        const appName = "por";
        //Action
        const result = checkMandatoryPathParameters(appName);
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
            [queryParameters.ORG_URL, "https://org.crm11.dynamics.com"],
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
            webExtensionTelemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING,
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
            [queryParameters.ORG_URL, "https://org.crm14.dynamics.com"],
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
            webExtensionTelemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING,
            checkMandatoryQueryParameters.name,
            `orgURL:https://org.crm14.dynamics.com, dataSource:, schemaName:1.0.0.0 ,websiteId:ed9a6c19-5ab6-4f67-8c35-2423cff958c4`
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
            [queryParameters.ORG_URL, "https://org.crm19.dynamics.com"],
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
            webExtensionTelemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING,
            checkMandatoryQueryParameters.name,
            `orgURL:https://org.crm19.dynamics.com, dataSource:SQL, schemaName: ,websiteId:ed9a6c19-5ab6-4f67-8c35-2423cff958c4`
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
            [queryParameters.ORG_URL, "https://org.crm4.dynamics.com"],
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
            webExtensionTelemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING,
            checkMandatoryQueryParameters.name,
            `orgURL:https://org.crm4.dynamics.com, dataSource:SQL, schemaName:1.0.0.0 ,websiteId:`
        );
    });

    it("checkMandatoryQueryParameters_whenAppNameIsNotPortal_shouldReturnFalse", () => {
        //Act
        const _mockShowErrorMessage = spy(vscode.window, "showErrorMessage");
        const appName = "por";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "https://org.crm4.dynamics.com"],
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

    it("checkMandatoryQueryParameters_whenOrgUrlIsInvalid_shouldReturnFalse", () => {
        //Act
        const _mockShowErrorMessage = spy(vscode.window, "showErrorMessage");
        const _mockSendErrorTelemetry = spy(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );

        const appName = "portal";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_URL, "https://org.dynamics.com"],
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


        const sendErrorTelemetryCalls = _mockSendErrorTelemetry.getCalls();
        assert.callCount(_mockSendErrorTelemetry, 2);
        assert.calledWithMatch(
            sendErrorTelemetryCalls[0],
            webExtensionTelemetryEventNames.WEB_EXTENSION_MULTI_FILE_INVALID_DATAVERSE_URL,
            isDynamicsCRMUrl.name,
            `orgURL:https://org.dynamics.com`
        );
        assert.calledWithMatch(
            sendErrorTelemetryCalls[1],
            webExtensionTelemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING,
            checkMandatoryQueryParameters.name,
            `orgURL:https://org.dynamics.com, dataSource:SQL, schemaName:1.0.0.0 ,websiteId:ed9a6c19-5ab6-4f67-8c35-2423cff958c4`
        );
    });
});
