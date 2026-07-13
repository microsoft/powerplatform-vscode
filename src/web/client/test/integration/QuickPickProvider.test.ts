/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import sinon, { stub, assert } from "sinon";
import { QuickPickProvider } from "../../webViews/QuickPickProvider";
import WebExtensionContext from "../../WebExtensionContext";
import * as Constants from "../../common/constants";
import { webExtensionTelemetryEventNames } from "../../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";

describe("QuickPickProvider", () => {
    afterEach(() => {
        sinon.restore();
    });

    it("showQuickPick_shouldSendActiveUsersViewedTelemetry", async () => {
        const provider = new QuickPickProvider();
        stub(vscode.window, "showQuickPick").resolves(undefined);
        const sendInfoTelemetry = stub(WebExtensionContext.telemetry, "sendInfoTelemetry");

        await provider.showQuickPick();

        assert.calledWith(
            sendInfoTelemetry,
            webExtensionTelemetryEventNames.WEB_EXTENSION_CO_PRESENCE_ACTIVE_USERS_VIEWED,
            { connectedUserCount: "0" }
        );
    });

    it("showQuickPick_whenUserSelected_shouldSendUserSelectedTelemetry", async () => {
        const provider = new QuickPickProvider();
        const showQuickPick = stub(vscode.window, "showQuickPick");
        // First call: the active-users list returns a selected user.
        // Second call: the collaboration options list is cancelled.
        showQuickPick.onFirstCall().resolves({ label: "User A", id: "userA" } as vscode.QuickPickItem);
        showQuickPick.onSecondCall().resolves(undefined);
        const sendInfoTelemetry = stub(WebExtensionContext.telemetry, "sendInfoTelemetry");

        await provider.showQuickPick();

        assert.calledWith(
            sendInfoTelemetry,
            webExtensionTelemetryEventNames.WEB_EXTENSION_CO_PRESENCE_USER_SELECTED
        );
    });

    it("collaborationQuickPick_whenTeamsSelected_shouldSendContactOptionTeams", async () => {
        const provider = new QuickPickProvider();
        stub(vscode.window, "showQuickPick").resolves({ label: Constants.START_TEAMS_CHAT } as vscode.QuickPickItem);
        stub(WebExtensionContext, "openTeamsChat");
        const sendInfoTelemetry = stub(WebExtensionContext.telemetry, "sendInfoTelemetry");

        await provider.collaborationQuickPick({ label: "User A", id: "userA" });

        assert.calledWith(
            sendInfoTelemetry,
            webExtensionTelemetryEventNames.WEB_EXTENSION_CO_PRESENCE_CONTACT_OPTION_SELECTED,
            { option: "teams" }
        );
    });

    it("collaborationQuickPick_whenEmailSelected_shouldSendContactOptionEmail", async () => {
        const provider = new QuickPickProvider();
        stub(vscode.window, "showQuickPick").resolves({ label: Constants.SEND_AN_EMAIL } as vscode.QuickPickItem);
        stub(WebExtensionContext, "openMail").resolves();
        const sendInfoTelemetry = stub(WebExtensionContext.telemetry, "sendInfoTelemetry");

        await provider.collaborationQuickPick({ label: "User A", id: "userA" });

        assert.calledWith(
            sendInfoTelemetry,
            webExtensionTelemetryEventNames.WEB_EXTENSION_CO_PRESENCE_CONTACT_OPTION_SELECTED,
            { option: "email" }
        );
    });
});
