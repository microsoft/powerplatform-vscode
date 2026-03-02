/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import Sinon, { stub, assert } from "sinon";
import { expect } from "chai";

import { queryParameters } from "../../common/constants";

import {
    checkMandatoryParameters,
    checkMandatoryPathParameters,
    checkMandatoryQueryParameters,
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


    it("checkMandatoryParameters_whenAppNameIsPortalAndEntityAndEntityIdHavingValues_shouldReturnTrue", () => {
        //Act
        const appName = "portal";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.ENV_ID, "2e23a54a-d9c1-4e5e-bb18-86a69841ad43"],
            [queryParameters.WEBSITE_ID, "a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
        ]);

        //Action
        const result = checkMandatoryParameters(
            appName,
            queryParamsMap
        );

        //Assert
        expect(result).true;
    });

    it("checkMandatoryParameters_whenPortalIdIsMissingButWebsiteIdIsPresent_shouldReturnTrue", () => {
        //Act
        const appName = "portal";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.ENV_ID, "2e23a54a-d9c1-4e5e-bb18-86a69841ad43"],
            [queryParameters.WEBSITE_ID, "a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
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
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.ENV_ID, "2e23a54a-d9c1-4e5e-bb18-86a69841ad43"],
            [queryParameters.WEBSITE_ID, "a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
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

    it("checkMandatoryParameters_whenOrgIdIsBlank_shouldReturnFalse", () => {
        //Act
        const appName = "portal";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, ""],
            [queryParameters.ENV_ID, "2e23a54a-d9c1-4e5e-bb18-86a69841ad43"],
            [queryParameters.WEBSITE_ID, "a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
        ]);
        //Action
        const result = checkMandatoryParameters(
            appName,
            queryParamsMap
        );
        //Assert
        expect(result).false;
    });

    it("checkMandatoryParameters_whenEnvIdIsBlank_shouldReturnFalse", () => {
        //Act
        const appName = "portal";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.ENV_ID, ""],
            [queryParameters.WEBSITE_ID, "a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
        ]);

        //Action
        const result = checkMandatoryParameters(
            appName,
            queryParamsMap
        );

        //Assert
        expect(result).false;
    });

    it("checkMandatoryParameters_whenWebsiteIdIsBlank_shouldReturnFalse", () => {
        //Act
        const appName = "portal";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.ENV_ID, "2e23a54a-d9c1-4e5e-bb18-86a69841ad43"],
            [queryParameters.WEBSITE_ID, ""]
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
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.ENV_ID, "2e23a54a-d9c1-4e5e-bb18-86a69841ad43"],
            [queryParameters.WEBSITE_ID, "a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
        ]);
        //Action
        const result = checkMandatoryQueryParameters(appName, queryParamsMap);
        //Assert
        expect(result).true;
    });
});
