/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import {
    AgentHost,
    AgentHostDetectionResult
} from "../../uriHandler/utils/detectAgentHost";
import {
    AgentHostSelection,
    selectAgentHost
} from "../../uriHandler/utils/selectAgentHost";

const mixedDetection: AgentHostDetectionResult[] = [
    {
        host: AgentHost.Copilot,
        installed: true,
        executablePath: "C:\\tools\\copilot.cmd",
        version: "1.2.3"
    },
    {
        host: AgentHost.Claude,
        installed: false
    }
];

describe("selectAgentHost", () => {
    it("shows both hosts in detection order with installation descriptions", async () => {
        const showQuickPick = sinon.stub().resolves(undefined);

        await selectAgentHost(mixedDetection, { showQuickPick });

        const items = showQuickPick.firstCall.firstArg as Array<vscode.QuickPickItem & AgentHostSelection>;
        expect(items.map(item => ({
            label: item.label,
            description: item.description,
            detail: item.detail,
            host: item.host,
            installed: item.installed,
            ...(item.executablePath
                ? { executablePath: item.executablePath }
                : {})
        }))).to.deep.equal([
            {
                label: "GitHub Copilot CLI",
                description: "Installed",
                detail: "Start a guided site-creation conversation with GitHub Copilot CLI.",
                host: AgentHost.Copilot,
                installed: true,
                executablePath: "C:\\tools\\copilot.cmd"
            },
            {
                label: "Claude Code",
                description: "Not installed",
                detail: "Start a guided site-creation conversation with Claude Code. Install it in the next step after you review the setup.",
                host: AgentHost.Claude,
                installed: false
            }
        ]);
    });

    it("shows the installed description without a version when none is available", async () => {
        const showQuickPick = sinon.stub().resolves(undefined);
        const detection: AgentHostDetectionResult[] = [
            {
                host: AgentHost.Copilot,
                installed: true
            },
            mixedDetection[1]
        ];

        await selectAgentHost(detection, { showQuickPick });

        const items = showQuickPick.firstCall.firstArg as vscode.QuickPickItem[];
        expect(items[0].description).to.equal("Installed");
    });

    it("shows the installed description when the version is whitespace-only", async () => {
        const showQuickPick = sinon.stub().resolves(undefined);
        const detection: AgentHostDetectionResult[] = [
            {
                host: AgentHost.Copilot,
                installed: true,
                version: "   "
            },
            mixedDetection[1]
        ];

        await selectAgentHost(detection, { showQuickPick });

        const items = showQuickPick.firstCall.firstArg as vscode.QuickPickItem[];
        expect(items[0].description).to.equal("Installed");
    });

    it("returns a selection when the chosen host is not installed", async () => {
        const showQuickPick = sinon.stub().callsFake(async (items: readonly vscode.QuickPickItem[]) => items[1]);

        const result = await selectAgentHost(mixedDetection, { showQuickPick });

        expect(result).to.deep.equal({
            host: AgentHost.Claude,
            installed: false
        });
    });

    it("returns a selection when the chosen host is installed", async () => {
        const showQuickPick = sinon.stub().callsFake(async (items: readonly vscode.QuickPickItem[]) => items[0]);

        const result = await selectAgentHost(mixedDetection, { showQuickPick });

        expect(result).to.deep.equal({
            host: AgentHost.Copilot,
            installed: true,
            executablePath: "C:\\tools\\copilot.cmd"
        });
    });

    it("returns undefined when the user cancels", async () => {
        const showQuickPick = sinon.stub().resolves(undefined);

        const result = await selectAgentHost(mixedDetection, { showQuickPick });

        expect(result).to.be.undefined;
    });
});
