/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { PlannedCommand } from "../../uriHandler/utils/agentHostCommandPlan";
import { launchAgentHostPlan } from "../../uriHandler/utils/launchAgentHostPlan";

describe("launchAgentHostPlan", () => {
    it("launches the exact previewed command plan in the selected folder", () => {
        const folderUri = vscode.Uri.file("C:\\sites\\target");
        const plan: PlannedCommand[] = [
            { commandLine: "marketplace-command", description: "register" },
            { commandLine: "install-command", description: "install" },
            { commandLine: "launch-command", description: "launch" }
        ];
        const calls: string[] = [];
        const terminal = {
            show: sinon.stub().callsFake(() => calls.push("show")),
            sendText: sinon.stub().callsFake((commandLine: string) => calls.push(commandLine))
        } as unknown as vscode.Terminal;
        const createTerminal = sinon.stub().returns(terminal);

        launchAgentHostPlan(folderUri, plan, "GitHub Copilot CLI", { createTerminal });

        expect(createTerminal.calledOnce).to.be.true;
        expect(createTerminal.firstCall.firstArg).to.deep.equal({
            name: "Power Pages Agent: GitHub Copilot CLI",
            cwd: folderUri.fsPath,
            isTransient: true
        });
        expect(calls).to.deep.equal([
            "show",
            "marketplace-command",
            "install-command",
            "launch-command"
        ]);
        expect((terminal.sendText as unknown as sinon.SinonStub).getCalls().map(call => call.args)).to.deep.equal([
            ["marketplace-command"],
            ["install-command"],
            ["launch-command"]
        ]);
    });
});
