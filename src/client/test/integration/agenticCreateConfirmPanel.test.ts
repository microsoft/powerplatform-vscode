/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as vscode from "vscode";
import {
    showAgenticCreateConfirmPanel,
    ShowConfirmPanelDependencies
} from "../../uriHandler/utils/agenticCreateConfirmPanel";
import { PlannedCommand } from "../../uriHandler/utils/agentHostCommandPlan";

describe("showAgenticCreateConfirmPanel", () => {
    const plan: PlannedCommand[] = [
        { commandLine: 'copilot plugin marketplace add "microsoft/power-platform-skills"', description: "register" },
        { commandLine: 'copilot -i "How to use Power Pages Plugin for creating a site?"', description: "start" }
    ];

    interface FakePanel {
        panel: vscode.WebviewPanel;
        emitMessage: (message: unknown) => void;
        emitDispose: () => void;
        disposeCalled: () => boolean;
        html: () => string;
    }

    const createFakePanel = (): FakePanel => {
        const messageEmitter = new vscode.EventEmitter<unknown>();
        const disposeEmitter = new vscode.EventEmitter<void>();
        let disposed = false;
        let htmlValue = "";

        const panel = {
            webview: {
                get html() {
                    return htmlValue;
                },
                set html(value: string) {
                    htmlValue = value;
                },
                onDidReceiveMessage: messageEmitter.event,
                asWebviewUri: (uri: vscode.Uri) => uri,
                cspSource: ""
            },
            onDidDispose: disposeEmitter.event,
            dispose: () => {
                disposed = true;
                disposeEmitter.fire();
            },
            reveal: () => undefined
        } as unknown as vscode.WebviewPanel;

        return {
            panel,
            emitMessage: (message) => messageEmitter.fire(message),
            emitDispose: () => disposeEmitter.fire(),
            disposeCalled: () => disposed,
            html: () => htmlValue
        };
    };

    const depsFor = (fake: FakePanel): ShowConfirmPanelDependencies => ({
        createWebviewPanel: () => fake.panel
    });

    it("resolves 'start' and disposes the panel when the user starts", async () => {
        const fake = createFakePanel();
        const decisionPromise = showAgenticCreateConfirmPanel("GitHub Copilot CLI", "c:/work/site", plan, depsFor(fake));

        fake.emitMessage({ decision: "start" });

        expect(await decisionPromise).to.equal("start");
        expect(fake.disposeCalled()).to.be.true;
    });

    it("resolves 'cancel' when the user cancels", async () => {
        const fake = createFakePanel();
        const decisionPromise = showAgenticCreateConfirmPanel("Claude Code", "c:/work/site", plan, depsFor(fake));

        fake.emitMessage({ decision: "cancel" });

        expect(await decisionPromise).to.equal("cancel");
    });

    it("resolves 'dismissed' when the panel is closed without a choice", async () => {
        const fake = createFakePanel();
        const decisionPromise = showAgenticCreateConfirmPanel("GitHub Copilot CLI", "c:/work/site", plan, depsFor(fake));

        fake.emitDispose();

        expect(await decisionPromise).to.equal("dismissed");
    });

    it("ignores unknown messages and keeps the panel open", async () => {
        const fake = createFakePanel();
        const decisionPromise = showAgenticCreateConfirmPanel("GitHub Copilot CLI", "c:/work/site", plan, depsFor(fake));

        fake.emitMessage({ decision: "bogus" });
        expect(fake.disposeCalled()).to.be.false;

        fake.emitMessage({ decision: "start" });
        expect(await decisionPromise).to.equal("start");
    });

    it("renders the host, folder, and every command line in the panel HTML", () => {
        const fake = createFakePanel();
        void showAgenticCreateConfirmPanel("GitHub Copilot CLI", "c:/work/site", plan, depsFor(fake));

        const html = fake.html();
        expect(html).to.contain("GitHub Copilot CLI");
        expect(html).to.contain("c:/work/site");
        for (const command of plan) {
            const escaped = command.commandLine.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
            expect(html).to.contain(escaped);
        }
    });
});
