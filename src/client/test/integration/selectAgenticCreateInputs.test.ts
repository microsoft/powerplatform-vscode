/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { MultiStepInput } from "../../../common/utilities/MultiStepInput";
import { URI_HANDLER_STRINGS } from "../../uriHandler/constants/uriStrings";
import { AgentHost, AgentHostDetectionResult } from "../../uriHandler/utils/detectAgentHost";
import { selectAgenticCreateInputs } from "../../uriHandler/utils/selectAgenticCreateInputs";

describe("selectAgenticCreateInputs", () => {
    const workspaceFolder = {
        index: 0,
        name: "Current site",
        uri: vscode.Uri.file("C:\\sites\\current")
    } as vscode.WorkspaceFolder;
    const detection: AgentHostDetectionResult[] = [
        {
            host: AgentHost.Copilot,
            installed: true,
            version: "1.2.3"
        },
        {
            host: AgentHost.Claude,
            installed: false
        }
    ];

    let sandbox: sinon.SinonSandbox;
    let showQuickPick: sinon.SinonStub;
    let showOpenDialog: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        showQuickPick = sandbox.stub();
        showOpenDialog = sandbox.stub();
    });

    afterEach(() => {
        sandbox.restore();
    });

    const runSteps = (): void => {
        sandbox.stub(MultiStepInput, "run").callsFake(async (start) => {
            const input = { showQuickPick } as unknown as MultiStepInput;
            let step = await start(input);
            while (step) {
                step = await step(input);
            }
        });
    };

    it("collects folder and host in one two-step flow", async () => {
        runSteps();
        showQuickPick.callsFake(async (options: {
            step: number;
            items: Array<vscode.QuickPickItem & { uri?: vscode.Uri }>;
        }) => options.step === 1 ? options.items[0] : options.items[1]);

        const result = await selectAgenticCreateInputs(detection, undefined, {
            getWorkspaceFolders: () => [workspaceFolder],
            showOpenDialog
        });

        expect(result).to.deep.equal({
            status: "selected",
            folderUri: workspaceFolder.uri,
            hostSelection: {
                host: AgentHost.Claude,
                installed: false
            }
        });
        expect(showQuickPick.callCount).to.equal(2);
        expect(showQuickPick.firstCall.firstArg).to.include({
            title: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.PANEL_TITLE,
            step: 1,
            totalSteps: 2,
            placeholder: URI_HANDLER_STRINGS.TITLES.TARGET_FOLDER,
            ignoreFocusOut: true
        });
        expect(showQuickPick.secondCall.firstArg).to.include({
            title: URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.PANEL_TITLE,
            step: 2,
            totalSteps: 2,
            placeholder: URI_HANDLER_STRINGS.PROMPTS.AGENT_HOST_SELECT,
            ignoreFocusOut: true
        });
        expect(showOpenDialog.notCalled).to.be.true;
    });

    it("returns to the folder step when Browse is cancelled", async () => {
        runSteps();
        let folderPickCount = 0;
        showQuickPick.callsFake(async (options: {
            step: number;
            items: Array<vscode.QuickPickItem & { browse?: true }>;
        }) => {
            if (options.step === 2) {
                return options.items[0];
            }
            folderPickCount++;
            return folderPickCount === 1
                ? options.items.find(item => item.browse)
                : options.items[0];
        });
        showOpenDialog.resolves(undefined);

        const result = await selectAgenticCreateInputs(detection, undefined, {
            getWorkspaceFolders: () => [workspaceFolder],
            showOpenDialog
        });

        expect(result.status).to.equal("selected");
        expect(showOpenDialog.calledOnce).to.be.true;
        expect(showQuickPick.callCount).to.equal(3);
    });

    it("reports Esc from the folder step", async () => {
        sandbox.stub(MultiStepInput, "run").callsFake(async (start) => {
            const input = {
                showQuickPick: sandbox.stub().rejects(new Error("cancelled"))
            } as unknown as MultiStepInput;
            try {
                await start(input);
            } catch {
                // MultiStepInput consumes its private cancellation action.
            }
        });

        const result = await selectAgenticCreateInputs(detection, undefined, {
            getWorkspaceFolders: () => [workspaceFolder],
            showOpenDialog
        });

        expect(result).to.deep.equal({ status: "cancelled", step: "folder" });
    });

    it("reports Esc from the host step with the selected folder", async () => {
        sandbox.stub(MultiStepInput, "run").callsFake(async (start) => {
            const input = {
                showQuickPick: sandbox.stub().callsFake(async (options: {
                    step: number;
                    items: Array<vscode.QuickPickItem>;
                }) => {
                    if (options.step === 1) {
                        return options.items[0];
                    }
                    throw new Error("cancelled");
                })
            } as unknown as MultiStepInput;
            const hostStep = await start(input);
            try {
                await hostStep?.(input);
            } catch {
                // MultiStepInput consumes its private cancellation action.
            }
        });

        const result = await selectAgenticCreateInputs(detection, undefined, {
            getWorkspaceFolders: () => [workspaceFolder],
            showOpenDialog
        });

        expect(result).to.deep.equal({
            status: "cancelled",
            step: "host",
            folderUri: workspaceFolder.uri
        });
    });

    it("preselects the current browsed folder and host when editing choices", async () => {
        runSteps();
        const browsedFolder = vscode.Uri.file("C:\\sites\\outside-workspace");
        const activeItems: vscode.QuickPickItem[] = [];
        showQuickPick.callsFake(async (options: {
            activeItem?: vscode.QuickPickItem;
        }) => {
            activeItems.push(options.activeItem as vscode.QuickPickItem);
            return options.activeItem;
        });

        const result = await selectAgenticCreateInputs(
            detection,
            {
                folderUri: browsedFolder,
                hostSelection: {
                    host: AgentHost.Claude,
                    installed: false
                }
            },
            {
                getWorkspaceFolders: () => [workspaceFolder],
                showOpenDialog
            }
        );

        expect(activeItems.map(item => item.label)).to.deep.equal([
            browsedFolder.fsPath,
            "Claude Code"
        ]);
        expect(result).to.deep.equal({
            status: "selected",
            folderUri: browsedFolder,
            hostSelection: {
                host: AgentHost.Claude,
                installed: false
            }
        });
    });
});
