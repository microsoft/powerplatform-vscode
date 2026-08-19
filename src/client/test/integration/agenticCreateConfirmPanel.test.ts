/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import {
    registerAgenticCreateConfirmPanelSerializer,
    showAgenticCreateConfirmPanel,
    ShowConfirmPanelDependencies
} from "../../uriHandler/utils/agenticCreateConfirmPanel";
import { URI_CONSTANTS } from "../../uriHandler/constants/uriConstants";
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
                cspSource: "vscode-webview://fake-webview-id"
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

    // VS Code delivers the `--vscode-*` theme variables through its own injected stylesheet. A
    // style-src that admits only our nonce excludes that stylesheet, every theme variable then
    // resolves to nothing, and `color: var(--vscode-foreground)` collapses to black — an
    // apparently blank panel on any dark theme. These assertions pin the two properties that
    // keep the content visible.
    describe("content security policy", () => {
        const cspOf = (html: string): string => {
            const match = /content="(default-src[^"]*)"/.exec(html);
            expect(match, "expected a Content-Security-Policy meta tag").to.not.be.null;
            return (match as RegExpExecArray)[1];
        };

        const renderHtml = (): string => {
            const fake = createFakePanel();
            void showAgenticCreateConfirmPanel("GitHub Copilot CLI", "c:/work/site", plan, depsFor(fake));
            return fake.html();
        };

        it("admits the webview's own stylesheet so theme variables resolve", () => {
            const styleSrc = /style-src ([^;]*);/.exec(cspOf(renderHtml()));

            expect(styleSrc, "expected a style-src directive").to.not.be.null;
            expect((styleSrc as RegExpExecArray)[1]).to.contain("vscode-webview://fake-webview-id");
        });

        it("keeps 'unsafe-inline' effective by omitting a nonce from style-src", () => {
            const styleSrc = /style-src ([^;]*);/.exec(cspOf(renderHtml()));
            const directive = (styleSrc as RegExpExecArray)[1];

            expect(directive).to.contain("'unsafe-inline'");
            // CSP3: a nonce in style-src causes 'unsafe-inline' to be ignored outright, which
            // would drop the inline style block this panel depends on.
            expect(directive).to.not.contain("nonce-");
        });

        it("still restricts scripts to the per-render nonce", () => {
            const html = renderHtml();
            const scriptSrc = /script-src ([^;]*);/.exec(cspOf(html));

            expect(scriptSrc, "expected a script-src directive").to.not.be.null;
            const nonceMatch = /^'nonce-([A-Za-z0-9]+)'$/.exec((scriptSrc as RegExpExecArray)[1].trim());
            expect(nonceMatch, "script-src should be exactly one nonce").to.not.be.null;
            expect(html).to.contain(`<script nonce="${(nonceMatch as RegExpExecArray)[1]}">`);
        });

        it("leaves body colour and font to VS Code's defaults", () => {
            const html = renderHtml();

            expect(html).to.not.contain("color: var(--vscode-foreground)");
            expect(html).to.not.contain("font-family: var(--vscode-font-family)");
        });

        it("gives every theme variable a fallback so nothing can render invisibly", () => {
            const html = renderHtml();
            const styleBlock = /<style>([\s\S]*?)<\/style>/.exec(html);
            expect(styleBlock, "expected an inline style block").to.not.be.null;

            const unguardedPattern = /var\(\s*(--vscode-[\w-]+)\s*\)/g;
            const unguarded: string[] = [];
            let match = unguardedPattern.exec((styleBlock as RegExpExecArray)[1]);
            while (match !== null) {
                unguarded.push(match[1]);
                match = unguardedPattern.exec((styleBlock as RegExpExecArray)[1]);
            }

            expect(unguarded, `theme variables used without a fallback: ${unguarded.join(", ")}`).to.be.empty;
        });
    });
});

describe("registerAgenticCreateConfirmPanelSerializer", () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("activates the extension when VS Code restores the panel", () => {
        const packageJson = vscode.extensions.getExtension(URI_CONSTANTS.EXTENSION_ID)?.packageJSON;

        expect(packageJson?.activationEvents).to.include(
            `onWebviewPanel:${URI_CONSTANTS.AGENTIC_CREATE_CONFIRM_VIEW_TYPE}`
        );
    });

    it("discards a restored panel only after its webview reports ready", async () => {
        let registeredViewType: string | undefined;
        let serializer: vscode.WebviewPanelSerializer | undefined;
        const disposable = { dispose: () => undefined } as vscode.Disposable;

        sandbox.stub(vscode.window, "registerWebviewPanelSerializer").callsFake(
            (viewType: string, panelSerializer: vscode.WebviewPanelSerializer) => {
                registeredViewType = viewType;
                serializer = panelSerializer;
                return disposable;
            }
        );

        const result = registerAgenticCreateConfirmPanelSerializer();

        expect(registeredViewType).to.equal(URI_CONSTANTS.AGENTIC_CREATE_CONFIRM_VIEW_TYPE);
        expect(result).to.equal(disposable);

        // The flow that owned the restored panel ended with the previous window, so the tab is
        // closed rather than left behind unable to answer anything. Waiting for a message from the
        // cleanup document prevents disposal from racing VS Code's service-worker registration.
        const messageEmitter = new vscode.EventEmitter<unknown>();
        const disposeEmitter = new vscode.EventEmitter<void>();
        const dispose = sandbox.stub();
        let html = "";
        let options: vscode.WebviewOptions = {};
        const panel = {
            webview: {
                get html() {
                    return html;
                },
                set html(value: string) {
                    html = value;
                },
                get options() {
                    return options;
                },
                set options(value: vscode.WebviewOptions) {
                    options = value;
                },
                onDidReceiveMessage: messageEmitter.event
            },
            onDidDispose: disposeEmitter.event,
            dispose
        } as unknown as vscode.WebviewPanel;

        await serializer?.deserializeWebviewPanel(panel, undefined);

        expect(dispose.notCalled).to.be.true;
        expect(options.enableScripts).to.be.true;
        expect(options.localResourceRoots).to.deep.equal([]);
        expect(html).to.contain("agenticCreateConfirmRestoredPanelReady");

        messageEmitter.fire({ type: "unrelated" });
        expect(dispose.notCalled).to.be.true;

        messageEmitter.fire({ type: "agenticCreateConfirmRestoredPanelReady" });

        expect(dispose.calledOnce).to.be.true;

        messageEmitter.dispose();
        disposeEmitter.dispose();
    });
});
