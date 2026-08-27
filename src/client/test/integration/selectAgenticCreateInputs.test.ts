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
    let showInputBox: sinon.SinonStub;
    let showOpenDialog: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        showQuickPick = sandbox.stub();
        showInputBox = sandbox.stub().callsFake(async (options: {
            value?: string;
        }) => options.value || "A community event site");
        showOpenDialog = sandbox.stub();
    });

    afterEach(() => {
        sandbox.restore();
    });

    const runSteps = (): void => {
        sandbox.stub(MultiStepInput, "run").callsFake(async (start) => {
            const input = {
                showQuickPick,
                showInputBox
            } as unknown as MultiStepInput;
            let step = await start(input);
            while (step) {
                step = await step(input);
            }
        });
    };

    it("collects folder, host, and site description in one three-step flow", async () => {
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
            },
            siteDescription: "A community event site"
        });
        expect(showQuickPick.callCount).to.equal(2);
        expect(showInputBox.calledOnce).to.be.true;
        expect(showQuickPick.firstCall.firstArg).to.include({
            title: URI_HANDLER_STRINGS.TITLES.TARGET_FOLDER,
            step: 1,
            totalSteps: 3,
            placeholder: URI_HANDLER_STRINGS.TITLES.TARGET_FOLDER_PLACEHOLDER,
            ignoreFocusOut: true
        });
        expect(showQuickPick.secondCall.firstArg).to.include({
            title: URI_HANDLER_STRINGS.TITLES.AI_ASSISTANT,
            step: 2,
            totalSteps: 3,
            placeholder: URI_HANDLER_STRINGS.PROMPTS.AGENT_HOST_SELECT,
            ignoreFocusOut: true
        });
        expect(showOpenDialog.notCalled).to.be.true;
        expect(showInputBox.firstCall.firstArg).to.include({
            title: URI_HANDLER_STRINGS.TITLES.SITE_DESCRIPTION,
            step: 3,
            totalSteps: 3,
            value: "",
            prompt: URI_HANDLER_STRINGS.PROMPTS.SITE_DESCRIPTION,
            placeholder: URI_HANDLER_STRINGS.PROMPTS.SITE_DESCRIPTION_PLACEHOLDER
        });
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
                },
                siteDescription: "A nonprofit support portal"
            },
            {
                getWorkspaceFolders: () => [workspaceFolder],
                showOpenDialog
            }
        );

        expect(activeItems.map(item => item.label)).to.deep.equal([
            "outside-workspace",
            "Claude Code"
        ]);
        expect(result).to.deep.equal({
            status: "selected",
            folderUri: browsedFolder,
            hostSelection: {
                host: AgentHost.Claude,
                installed: false
            },
            siteDescription: "A nonprofit support portal"
        });
        expect(showInputBox.firstCall.firstArg.value).to.equal(
            "A nonprofit support portal"
        );
    });

    it("reports Esc from the site-description step", async () => {
        sandbox.stub(MultiStepInput, "run").callsFake(async (start) => {
            const input = {
                showQuickPick: sandbox.stub().callsFake(async (options: {
                    items: vscode.QuickPickItem[];
                }) => options.items[0]),
                showInputBox: sandbox.stub().rejects(new Error("cancelled"))
            } as unknown as MultiStepInput;
            let step = await start(input);
            try {
                while (step) {
                    step = await step(input);
                }
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
            step: "siteDescription",
            folderUri: workspaceFolder.uri
        });
    });

    it("does not reuse a prefilled description when Edit is cancelled at that step", async () => {
        const initialSelection = {
            folderUri: workspaceFolder.uri,
            hostSelection: {
                host: AgentHost.Copilot,
                installed: true
            },
            siteDescription: "The original site description"
        };
        sandbox.stub(MultiStepInput, "run").callsFake(async (start) => {
            const input = {
                showQuickPick: sandbox.stub().callsFake(async (options: {
                    activeItem?: vscode.QuickPickItem;
                    items: vscode.QuickPickItem[];
                }) => options.activeItem ?? options.items[0]),
                showInputBox: sandbox.stub().rejects(new Error("cancelled"))
            } as unknown as MultiStepInput;
            let step = await start(input);
            try {
                while (step) {
                    step = await step(input);
                }
            } catch {
                // MultiStepInput consumes its private cancellation action.
            }
        });

        const result = await selectAgenticCreateInputs(
            detection,
            initialSelection,
            {
                getWorkspaceFolders: () => [workspaceFolder],
                showOpenDialog
            }
        );

        expect(result).to.deep.equal({
            status: "cancelled",
            step: "siteDescription",
            folderUri: workspaceFolder.uri
        });
    });

    it("requires a non-empty site description and limits its length", async () => {
        runSteps();
        showQuickPick.callsFake(async (options: {
            items: vscode.QuickPickItem[];
        }) => options.items[0]);
        showInputBox.resolves("A public library portal");

        await selectAgenticCreateInputs(detection, undefined, {
            getWorkspaceFolders: () => [workspaceFolder],
            showOpenDialog
        });

        const validate = showInputBox.firstCall.firstArg.validate as (
            value: string
        ) => Promise<string | undefined>;
        expect(await validate("   ")).to.equal(
            URI_HANDLER_STRINGS.ERRORS.SITE_DESCRIPTION_REQUIRED
        );
        expect(await validate("a".repeat(1001))).to.equal(
            URI_HANDLER_STRINGS.ERRORS.SITE_DESCRIPTION_TOO_LONG
        );
        expect(await validate("A public library portal")).to.be.undefined;
    });
});
