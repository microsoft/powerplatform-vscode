/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import {
    disposeAgenticCreateConfirmPanels,
    showAgenticCreateConfirmPanel,
    ShowConfirmPanelDependencies
} from "../../uriHandler/utils/agenticCreateConfirmPanel";
import { URI_CONSTANTS } from "../../uriHandler/constants/uriConstants";
import { PlannedCommand } from "../../uriHandler/utils/agentHostCommandPlan";

describe("showAgenticCreateConfirmPanel", () => {
    const plan: PlannedCommand[] = [
        {
            kind: "registerMarketplace",
            commandLine: 'copilot plugin marketplace add "microsoft/power-platform-skills"',
            description: "register"
        },
        {
            kind: "launchHost",
            commandLine: 'copilot -i "/power-pages:create-site A community event site"',
            description: "start"
        }
    ];

    interface FakePanel {
        panel: vscode.WebviewPanel;
        emitMessage: (message: unknown) => void;
        emitDispose: () => void;
        emitViewState: () => void;
        disposeCalled: () => boolean;
        html: () => string;
        postedMessages: () => unknown[];
    }

    const createFakePanel = (): FakePanel => {
        const messageEmitter = new vscode.EventEmitter<unknown>();
        const disposeEmitter = new vscode.EventEmitter<void>();
        const viewStateEmitter = new vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>();
        let disposed = false;
        let htmlValue = "";
        const postedMessages: unknown[] = [];

        const panel = {
            webview: {
                get html() {
                    return htmlValue;
                },
                set html(value: string) {
                    htmlValue = value;
                },
                onDidReceiveMessage: messageEmitter.event,
                postMessage: (message: unknown) => {
                    postedMessages.push(message);
                    return Promise.resolve(true);
                },
                asWebviewUri: (uri: vscode.Uri) => uri,
                cspSource: "vscode-webview://fake-webview-id"
            },
            onDidDispose: disposeEmitter.event,
            onDidChangeViewState: viewStateEmitter.event,
            visible: true,
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
            emitViewState: () => viewStateEmitter.fire({ webviewPanel: panel }),
            disposeCalled: () => disposed,
            html: () => htmlValue,
            postedMessages: () => postedMessages
        };
    };

    const depsFor = (fake: FakePanel): ShowConfirmPanelDependencies => ({
        createWebviewPanel: () => fake.panel,
        showErrorMessage: sinon.stub().resolves(undefined)
    });

    it("resolves 'start' without replacing the accessible document", async () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel("GitHub Copilot CLI", "c:/work/site", plan, depsFor(fake));
        const initialHtml = fake.html();

        fake.emitMessage({ decision: "start" });

        expect(await session.decision).to.equal("start");
        expect(fake.disposeCalled()).to.be.false;
        expect(fake.html()).to.equal(initialHtml);
        for (const command of plan) {
            expect(fake.html()).to.contain(command.commandLine.replace(/"/g, "&quot;"));
        }
    });

    it("disposes active transient panels during extension deactivation", () => {
        disposeAgenticCreateConfirmPanels();
        const fake = createFakePanel();
        void showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            depsFor(fake)
        );

        disposeAgenticCreateConfirmPanels();

        expect(fake.disposeCalled()).to.be.true;
    });

    it("ignores progress updates after the confirmation panel is disposed", async () => {
        disposeAgenticCreateConfirmPanels();
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            depsFor(fake)
        );

        fake.emitMessage({ decision: "start" });
        expect(await session.decision).to.equal("start");
        disposeAgenticCreateConfirmPanels();

        expect(await session.showProgress({
            command: plan[0],
            step: 1,
            totalSteps: 2,
            status: "running"
        })).to.be.false;
        expect(await session.showLaunched({
            status: "launched"
        })).to.be.false;
    });

    it("recreates the panel once when its active webview never reports ready", async () => {
        const clock = sinon.useFakeTimers();
        const first = createFakePanel();
        const second = createFakePanel();
        const createWebviewPanel = sinon.stub();
        const showErrorMessage = sinon.stub().resolves(undefined);
        createWebviewPanel.onFirstCall().returns(first.panel);
        createWebviewPanel.onSecondCall().returns(second.panel);
        const session = showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            { createWebviewPanel, showErrorMessage }
        );

        await clock.tickAsync(4000);

        expect(createWebviewPanel.calledOnce).to.be.true;
        expect(first.disposeCalled()).to.be.true;
        expect(second.disposeCalled()).to.be.false;

        await clock.tickAsync(250);

        expect(createWebviewPanel.calledTwice).to.be.true;
        expect(second.disposeCalled()).to.be.false;
        expect(second.html()).to.contain("agenticCreateConfirmReady");

        second.emitMessage({ type: "agenticCreateConfirmReady" });
        await clock.tickAsync(4000);
        expect(createWebviewPanel.calledTwice).to.be.true;

        second.emitMessage({ decision: "cancel" });
        expect(await session.decision).to.equal("cancel");
        clock.restore();
    });

    it("dismisses the flow when the replacement webview also fails to report ready", async () => {
        const clock = sinon.useFakeTimers();
        const first = createFakePanel();
        const second = createFakePanel();
        const createWebviewPanel = sinon.stub();
        const showErrorMessage = sinon.stub().resolves(undefined);
        createWebviewPanel.onFirstCall().returns(first.panel);
        createWebviewPanel.onSecondCall().returns(second.panel);
        const session = showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            { createWebviewPanel, showErrorMessage }
        );

        await clock.tickAsync(4000);
        await clock.tickAsync(250);
        await clock.tickAsync(4000);

        expect(createWebviewPanel.calledTwice).to.be.true;
        expect(first.disposeCalled()).to.be.true;
        expect(second.disposeCalled()).to.be.true;
        expect(showErrorMessage.calledOnceWithExactly(
            "VS Code couldn't open the site setup page. Run the command again."
        )).to.be.true;
        expect(await session.decision).to.equal("dismissed");
        clock.restore();
    });

    it("cancels a pending replacement during extension deactivation", async () => {
        const clock = sinon.useFakeTimers();
        disposeAgenticCreateConfirmPanels();
        const first = createFakePanel();
        const second = createFakePanel();
        const createWebviewPanel = sinon.stub();
        createWebviewPanel.onFirstCall().returns(first.panel);
        createWebviewPanel.onSecondCall().returns(second.panel);
        const session = showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            {
                createWebviewPanel,
                showErrorMessage: sinon.stub().resolves(undefined)
            }
        );

        await clock.tickAsync(4000);
        disposeAgenticCreateConfirmPanels();
        await clock.tickAsync(250);

        expect(first.disposeCalled()).to.be.true;
        expect(createWebviewPanel.calledOnce).to.be.true;
        expect(second.disposeCalled()).to.be.false;
        expect(await session.decision).to.equal("dismissed");
        clock.restore();
    });

    it("does not register transient confirmation panels for restoration", () => {
        const packageJson = vscode.extensions.getExtension(
            URI_CONSTANTS.EXTENSION_ID
        )?.packageJSON;

        expect(packageJson?.activationEvents).to.not.include(
            `onWebviewPanel:${URI_CONSTANTS.AGENTIC_CREATE_CONFIRM_VIEW_TYPE}`
        );
        expect(URI_CONSTANTS.AGENTIC_CREATE_CONFIRM_VIEW_TYPE).to.equal(
            "powerPagesAgenticCreateConfirm.v2"
        );
    });

    it("ignores a queued Edit message after Start has already settled", async () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            depsFor(fake)
        );

        fake.emitMessage({ decision: "start" });
        fake.emitMessage({ decision: "edit" });

        expect(await session.decision).to.equal("start");
        expect(fake.disposeCalled()).to.be.false;
    });

    it("resolves 'cancel' when the user cancels", async () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel("Claude Code", "c:/work/site", plan, depsFor(fake));

        fake.emitMessage({ decision: "cancel" });

        expect(await session.decision).to.equal("cancel");
        expect(fake.disposeCalled()).to.be.true;
    });

    it("resolves 'edit' and closes the stale confirmation panel", async () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            depsFor(fake)
        );

        fake.emitMessage({ decision: "edit" });

        expect(await session.decision).to.equal("edit");
        expect(fake.disposeCalled()).to.be.true;
    });

    it("omits Edit choices when the caller cannot reopen selection", () => {
        const fake = createFakePanel();

        void showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            depsFor(fake),
            false
        );

        expect(fake.html()).to.not.contain('id="edit"');
        expect(fake.html()).to.not.contain(">Edit choices<");
    });

    it("resolves 'dismissed' when the panel is closed without a choice", async () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel("GitHub Copilot CLI", "c:/work/site", plan, depsFor(fake));

        fake.emitDispose();

        expect(await session.decision).to.equal("dismissed");
    });

    it("ignores unknown messages and keeps the panel open", async () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel("GitHub Copilot CLI", "c:/work/site", plan, depsFor(fake));

        fake.emitMessage({ decision: "bogus" });
        expect(fake.disposeCalled()).to.be.false;

        fake.emitMessage({ decision: "start" });
        expect(await session.decision).to.equal("start");
    });

    it("closes the command reference when Close is activated after Start", async () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            depsFor(fake)
        );

        fake.emitMessage({ decision: "start" });
        expect(await session.decision).to.equal("start");

        fake.emitMessage({ action: "close" });

        expect(fake.disposeCalled()).to.be.true;
    });

    it("renders persistent live regions and restores the started state without rerunning", () => {
        const fake = createFakePanel();
        void showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            depsFor(fake)
        );

        const html = fake.html();
        expect(html).to.contain('id="running-status" role="status" aria-live="polite" aria-atomic="true"');
        expect(html).to.contain('id="recovery-status" role="alert" aria-live="assertive" aria-atomic="true"');
        expect(html).to.contain('id="close" title="Close this page." hidden');
        expect(html).to.contain("closeButton.focus()");
        expect(html).to.contain('saveState({ state: "running" })');
        expect(html).to.contain("const persistedState = vscode.getState()");
    });

    it("posts an assertive recovery state with the failed command description", async () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            depsFor(fake)
        );

        const recoveryDecision = session.showRecovery({
            status: "recovery",
            reason: "commandFailed",
            failedCommand: plan[0],
            exitCode: 1
        });

        expect(fake.postedMessages()).to.deep.equal([{
            type: "agenticCreateConfirmState",
            state: "recovery",
            message: "We couldn't complete this step: register. Review Technical details for more information, or try again. No site files were changed.",
            setupOptionsAvailable: false
        }]);
        fake.emitMessage({ action: "retry" });
        expect(await recoveryDecision).to.equal("retry");
    });

    it("reposts the recovery state when a hidden webview becomes visible again", async () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            depsFor(fake)
        );

        const recoveryDecision = session.showRecovery({
            status: "recovery",
            reason: "commandFailed",
            failedCommand: plan[0],
            exitCode: 1
        });
        fake.emitViewState();

        expect(fake.postedMessages()).to.have.length(2);
        expect(fake.postedMessages()[1]).to.deep.equal(fake.postedMessages()[0]);
        fake.emitMessage({ action: "fallback" });
        expect(await recoveryDecision).to.equal("fallback");
    });

    it("posts a specific recovery state when Shell Integration is unavailable", async () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel(
            "Claude Code",
            "c:/work/site",
            plan,
            depsFor(fake)
        );

        const recoveryDecision = session.showRecovery({
            status: "recovery",
            reason: "shellIntegrationUnavailable"
        });

        expect(fake.postedMessages()[0]).to.deep.equal({
            type: "agenticCreateConfirmState",
            state: "recovery",
            message: "The terminal wasn't ready in time. Close terminals you don't need, then try again. No site files were changed.",
            setupOptionsAvailable: false
        });
        fake.emitMessage({ action: "close" });
        expect(await recoveryDecision).to.equal("cancel");
    });

    it("explains how to enable Shell Integration before retrying", async () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel(
            "Claude Code",
            "c:/work/site",
            plan,
            depsFor(fake)
        );

        const recoveryDecision = session.showRecovery({
            status: "recovery",
            reason: "shellIntegrationDisabled"
        });

        expect(fake.postedMessages()[0]).to.deep.equal({
            type: "agenticCreateConfirmState",
            state: "recovery",
            message: "Terminal shell integration is turned off. Turn on Terminal › Integrated: Shell Integration Enabled in Settings, then try again. No site files were changed.",
            setupOptionsAvailable: false
        });
        fake.emitMessage({ action: "close" });
        expect(await recoveryDecision).to.equal("cancel");
    });

    it("explains how to select a supported terminal profile", async () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel(
            "Claude Code",
            "c:/work/site",
            plan,
            depsFor(fake)
        );

        const recoveryDecision = session.showRecovery({
            status: "recovery",
            reason: "unsupportedShell"
        });

        expect(fake.postedMessages()[0]).to.deep.equal({
            type: "agenticCreateConfirmState",
            state: "recovery",
            message: process.platform === "win32"
                ? "This terminal profile isn't supported. Choose PowerShell 7 or Bash as your default terminal profile, then try again. No site files were changed."
                : "This terminal profile isn't supported. Choose PowerShell, Bash, Zsh, or Fish as your default terminal profile, then try again. No site files were changed.",
            setupOptionsAvailable: false
        });
        fake.emitMessage({ action: "close" });
        expect(await recoveryDecision).to.equal("cancel");
    });

    it("explains how to recover from a batch-only assistant installation", async () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel(
            "Claude Code",
            "c:/work/site",
            plan,
            depsFor(fake)
        );

        const recoveryDecision = session.showRecovery({
            status: "recovery",
            reason: "unsupportedHostExecutable"
        });

        expect(fake.postedMessages()[0]).to.deep.equal({
            type: "agenticCreateConfirmState",
            state: "recovery",
            message: "This AI assistant installation can't safely receive your site description. Reinstall the assistant, then try again. No site files were changed.",
            setupOptionsAvailable: false
        });
        fake.emitMessage({ action: "close" });
        expect(await recoveryDecision).to.equal("cancel");
    });

    it("cancels recovery when the command-reference panel was already closed", async () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel(
            "Claude Code",
            "c:/work/site",
            plan,
            depsFor(fake)
        );
        fake.emitMessage({ decision: "start" });
        await session.decision;
        fake.emitMessage({ action: "close" });

        const decision = await session.showRecovery({
            status: "recovery",
            reason: "commandFailed",
            failedCommand: plan[0]
        });

        expect(decision).to.equal("cancel");
    });

    it("offers setup options for a failed missing-assistant bootstrap", () => {
        const fake = createFakePanel();
        const session = showAgenticCreateConfirmPanel(
            "Claude Code",
            "c:/work/site",
            plan,
            depsFor(fake),
            true,
            {
                marketplace: "unknown",
                plugin: "unknown"
            },
            true
        );

        void session.showRecovery({
            status: "recovery",
            reason: "commandFailed",
            failedCommand: {
                kind: "installHost",
                commandLine: "install-host",
                description: "prepare Claude Code"
            }
        });

        expect(fake.postedMessages()[0]).to.deep.equal({
            type: "agenticCreateConfirmState",
            state: "recovery",
            message: "We couldn't complete this step: prepare Claude Code. Try again, or select View setup options. No site files were changed.",
            setupOptionsAvailable: true
        });
        fake.emitMessage({ action: "fallback" });
    });

    it("renders a maker-first hierarchy with collapsed technical details", () => {
        const fake = createFakePanel();
        void showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            depsFor(fake),
            true,
            {
                marketplace: "present",
                plugin: "present"
            },
            false,
            undefined,
            "A volunteer portal for a food bank"
        );

        const html = fake.html();
        expect(html).to.contain("<h1>Review your site setup</h1>");
        expect(html).to.contain("You don&#39;t need command-line experience.");
        expect(html).to.contain('id="summary-title"');
        expect(html).to.contain("What happens next");
        expect(html).to.contain("Power Pages Plugin is installed");
        expect(html).to.contain('<details id="technical-details">');
        expect(html).to.not.contain('<details id="technical-details" open>');
        expect(html).to.contain(">Start creating</button>");
        expect(html).to.contain(">Change choices</button>");
        expect(html).to.contain("Already set up");
        expect(html).to.contain("Site to create");
        expect(html).to.contain("A volunteer portal for a food bank");
        expect(html).to.contain("Prepare the Power Pages Plugin");
        expect(html).to.contain("VS Code won&#39;t change your setup until you select Start creating.");
    });

    it("describes the setup action that matches the current plugin state", () => {
        const scenarios = [
            {
                setupState: {
                    marketplace: "present" as const,
                    plugin: "missing" as const
                },
                expected: "VS Code will install the Power Pages Plugin"
            },
            {
                setupState: {
                    marketplace: "present" as const,
                    plugin: "disabled" as const
                },
                expected: "VS Code will enable the Power Pages Plugin"
            },
            {
                setupState: {
                    marketplace: "unknown" as const,
                    plugin: "unknown" as const
                },
                expected: "VS Code will check the Power Pages Plugin setup"
            }
        ];

        for (const scenario of scenarios) {
            const fake = createFakePanel();
            void showAgenticCreateConfirmPanel(
                "Claude Code",
                "c:/work/site",
                plan,
                depsFor(fake),
                true,
                scenario.setupState
            );

            expect(fake.html()).to.contain(scenario.expected);
        }
    });

    it("labels conditional setup commands as running only when needed", () => {
        const fake = createFakePanel();
        const conditionalPlan: PlannedCommand[] = [{
            kind: "installPlugin",
            commandLine: "copilot plugin install power-pages@power-platform-skills",
            description: "Install the Power Pages Plugin",
            runWhenSetupState: {
                component: "plugin",
                states: ["missing", "unknown"]
            }
        }];

        void showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            conditionalPlan,
            depsFor(fake)
        );

        expect(fake.html()).to.contain("Runs only if needed");
    });

    it("renders WCAG-oriented keyboard, reflow, forced-colors, and reduced-motion support", () => {
        const fake = createFakePanel();
        void showAgenticCreateConfirmPanel(
            "Claude Code",
            "c:/work/site",
            plan,
            depsFor(fake)
        );

        const html = fake.html();
        expect(html).to.contain("<main id=\"main-content\">");
        expect(html).to.contain("@media (max-width: 480px)");
        expect(html).to.contain("@media (forced-colors: active)");
        expect(html).to.contain("@media (prefers-reduced-motion: reduce)");
        expect(html).to.contain("min-height: 32px");
        expect(html).to.contain("aria-live=\"polite\"");
        expect(html).to.contain("role=\"alert\"");
        expect(html).to.contain("technicalDetails.open = true");
        expect(html).to.contain("technicalDetails.open && event.isTrusted");
    });

    it("posts progress and launched states and reveals the launched terminal", async () => {
        const fake = createFakePanel();
        const show = sinon.stub();
        const terminal = { show } as unknown as vscode.Terminal;
        const session = showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            depsFor(fake)
        );

        await session.showProgress({
            command: plan[0],
            step: 1,
            totalSteps: 2,
            status: "running"
        });
        await session.showLaunched({
            status: "launched",
            terminal
        });
        fake.emitMessage({ action: "goToTerminal" });

        expect(fake.postedMessages()).to.deep.equal([
            {
                type: "agenticCreateConfirmState",
                state: "progress",
                description: "Prepare the Power Pages Plugin",
                step: 1,
                totalSteps: 2,
                status: "running"
            },
            {
                type: "agenticCreateConfirmState",
                state: "launched"
            }
        ]);
        expect(show.calledOnce).to.be.true;
    });

    it("reports Technical details expansion only once", () => {
        const fake = createFakePanel();
        const onExpanded = sinon.stub();
        void showAgenticCreateConfirmPanel(
            "GitHub Copilot CLI",
            "c:/work/site",
            plan,
            depsFor(fake),
            true,
            {
                marketplace: "missing",
                plugin: "missing"
            },
            false,
            onExpanded
        );

        fake.emitMessage({ action: "technicalDetailsExpanded" });
        fake.emitMessage({ action: "technicalDetailsExpanded" });

        expect(onExpanded.calledOnce).to.be.true;
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
