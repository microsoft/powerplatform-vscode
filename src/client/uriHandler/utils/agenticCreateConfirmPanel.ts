/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as path from "path";
import { getNonce } from "../../../common/utilities/Utils";
import { URI_CONSTANTS } from "../constants/uriConstants";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";
import { PlannedCommand } from "./agentHostCommandPlan";
import type { LaunchAgentHostPlanResult } from "./launchAgentHostPlan";
import type { LaunchAgentHostProgress } from "./launchAgentHostPlan";
import {
    AgentHostSetupState,
    UNKNOWN_AGENT_HOST_SETUP
} from "./agentHostSetupPrecheck";

/**
 * The user's decision at the confirmation gate.
 * - `start`     run the previewed command plan.
 * - `edit`      return to folder and agent-host selection.
 * - `cancel`    explicitly abandon the flow.
 * - `dismissed` the panel was closed without a choice (possibly accidental).
 */
export type ConfirmDecision = "start" | "edit" | "cancel" | "dismissed";
export type ConfirmRecoveryDecision = "retry" | "fallback" | "cancel";
type MakerProgressStage = "prepareAssistant" | "checkGuidance" | "startSite";

const MAKER_PROGRESS_STAGE_BY_COMMAND: Record<
    PlannedCommand["kind"],
    MakerProgressStage
> = {
    installHost: "prepareAssistant",
    refreshPath: "prepareAssistant",
    verifyHost: "prepareAssistant",
    checkMarketplace: "checkGuidance",
    checkPlugin: "checkGuidance",
    registerMarketplace: "checkGuidance",
    installPlugin: "checkGuidance",
    enablePlugin: "checkGuidance",
    launchHost: "startSite"
};

/**
 * Active confirmation panel controlled by the launch orchestrator.
 */
export interface AgenticCreateConfirmPanelSession {
    decision: Promise<ConfirmDecision>;
    showRecovery(
        result: Extract<LaunchAgentHostPlanResult, { status: "recovery" }>
    ): Promise<ConfirmRecoveryDecision>;
    showProgress(progress: LaunchAgentHostProgress): PromiseLike<boolean>;
    showLaunched(
        result: Extract<LaunchAgentHostPlanResult, { status: "launched" }>
    ): PromiseLike<boolean>;
}

/**
 * Side effects used by {@link showAgenticCreateConfirmPanel}. Injected so the panel can be tested
 * with a fake webview panel.
 */
export interface ShowConfirmPanelDependencies {
    createWebviewPanel: (
        viewType: string,
        title: string,
        showOptions: vscode.ViewColumn,
        options: vscode.WebviewPanelOptions & vscode.WebviewOptions
    ) => vscode.WebviewPanel;
}

const DEFAULT_CONFIRM_PANEL_DEPENDENCIES: ShowConfirmPanelDependencies = {
    createWebviewPanel: (viewType, title, showOptions, options) =>
        vscode.window.createWebviewPanel(viewType, title, showOptions, options)
};

const RESTORED_PANEL_READY_MESSAGE = "agenticCreateConfirmRestoredPanelReady";
const RESTORED_PANEL_DISPOSE_TIMEOUT_MS = 5000;

/**
 * Escapes a string for safe interpolation into HTML text/attribute content. Folder paths and
 * command lines are the only interpolated values and are not fully trusted, so they are escaped
 * to prevent breaking out of the markup.
 */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Substitutes a single positional argument into a localized `{0}` template.
 */
function formatTemplate(template: string, value: string): string {
    return template.split("{0}").join(value);
}

/**
 * Builds the accessible recovery announcement for a failed execution.
 */
function formatRecoveryStatus(
    result: Extract<LaunchAgentHostPlanResult, { status: "recovery" }>
): string {
    const confirm = URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM;
    if (result.reason === "shellIntegrationUnavailable") {
        return confirm.SHELL_INTEGRATION_RECOVERY_STATUS;
    }

    const failedDescription = (result.failedCommand?.description ?? confirm.SEQUENCE_HEADER)
        .replace(/[\s.!?。！？]+$/u, "");
    return formatTemplate(
        confirm.COMMAND_RECOVERY_STATUS,
        failedDescription
    );
}

/**
 * Builds the full HTML document for the confirmation panel. Styling is driven by VS Code theme CSS
 * variables so it honors the active theme (including high-contrast).
 *
 * Two details here are load-bearing and easy to regress:
 *
 * 1. `style-src` must admit VS Code's own injected stylesheet, which carries the `--vscode-*`
 *    theme variables and the webview's default background. A bare `'nonce-...'` style-src excludes
 *    it, and the variables then resolve to nothing: `color: var(--vscode-foreground)` becomes
 *    invalid and falls back to black, which on a dark theme renders as an apparently blank panel.
 *    `cspSource` plus `'unsafe-inline'` is the pattern VS Code documents for inline styles. The
 *    script keeps its nonce, so the directive that actually guards against injection is unchanged
 *    (and every interpolated value is HTML-escaped regardless).
 *
 * 2. Every `var()` carries a fallback, and body deliberately sets neither `color` nor
 *    `font-family` — VS Code's defaults already supply both. Text can then never be styled into
 *    invisibility if a variable is missing.
 */
function buildHtml(
    hostDisplayName: string,
    folderPath: string,
    plan: PlannedCommand[],
    cspSource: string,
    allowEdit: boolean,
    setupState: AgentHostSetupState,
    hostNeedsInstall: boolean
): string {
    const nonce = getNonce();
    const confirm = URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM;
    const title = confirm.TITLE;
    const folderName = path.basename(folderPath);
    const setupReady = setupState.marketplace === "present"
        && setupState.plugin === "present";
    const setupSummary = hostNeedsInstall
        ? confirm.SETUP_ASSISTANT_REQUIRED
        : setupReady
            ? confirm.SETUP_READY
            : confirm.SETUP_GUIDANCE_REQUIRED;
    const assistantDetail = hostNeedsInstall
        ? confirm.PREPARE_ASSISTANT_DETAIL
        : confirm.ASSISTANT_READY_DETAIL;
    const alreadySetupItems = [
        setupState.marketplace === "present"
            ? `<li class="command already-set-up">
                <div class="command-desc">${escapeHtml(confirm.MARKETPLACE_NAME)}</div>
                <span class="command-meta">${escapeHtml(confirm.ALREADY_SETUP)}</span>
            </li>`
            : "",
        setupState.plugin === "present"
            ? `<li class="command already-set-up">
                <div class="command-desc">${escapeHtml(confirm.GUIDANCE_NAME)}</div>
                <span class="command-meta">${escapeHtml(confirm.ALREADY_SETUP)}</span>
            </li>`
            : ""
    ].join("");

    const commandItems = plan
        .map(
            (command) => `
            <li class="command">
                <div class="command-heading">
                    <span class="command-desc">${escapeHtml(command.description)}</span>
                    ${command.setupCheck
                        ? `<span class="command-meta">${escapeHtml(confirm.READ_ONLY_CHECK)}</span>`
                        : ""}
                    ${command.runWhenSetupState
                        ? `<span class="command-meta">${escapeHtml(confirm.CONDITIONAL_COMMAND)}</span>`
                        : ""}
                </div>
                <code class="command-line">${escapeHtml(command.commandLine)}</code>
            </li>`
        )
        .join("");

    return `<!DOCTYPE html>
<html lang="${escapeHtml(vscode.env.language)}">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
        * { box-sizing: border-box; }
        body { padding: 0 clamp(16px, 4vw, 32px) 32px; max-width: 860px; }
        main { min-width: 0; }
        h1 { font-size: clamp(1.35em, 3vw, 1.75em); font-weight: 600; margin: 0.8em 0 0.35em; line-height: 1.25; }
        .description { color: var(--vscode-descriptionForeground, inherit); margin: 0 0 1.5em; max-width: 68ch; line-height: 1.55; }
        .state-panel { background: var(--vscode-textBlockQuote-background, rgba(127, 127, 127, 0.12)); border: 1px solid var(--vscode-widget-border, rgba(127, 127, 127, 0.35)); border-radius: 6px; padding: 14px 16px; margin: 1em 0; }
        .state-panel h2 { font-size: 1.05em; margin: 0 0 0.35em; }
        .state-panel p { margin: 0; line-height: 1.5; }
        .state-panel.recovery { border-color: var(--vscode-notificationsWarningIcon-foreground, #b89500); }
        h2.section-header { font-size: 1.05em; font-weight: 600; margin: 1.7em 0 0.8em; }
        dl.summary { display: grid; grid-template-columns: minmax(110px, max-content) minmax(0, 1fr); gap: 10px 20px; margin: 0; padding: 14px 16px; border: 1px solid var(--vscode-widget-border, rgba(127, 127, 127, 0.35)); border-radius: 6px; }
        dl.summary dt { color: var(--vscode-descriptionForeground, inherit); }
        dl.summary dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
        .summary-primary { display: block; font-weight: 600; }
        .summary-secondary { display: block; margin-top: 2px; color: var(--vscode-descriptionForeground, inherit); font-size: 0.9em; }
        ol.journey { margin: 0; padding-left: 1.5em; }
        ol.journey li { padding: 0 0 0.9em 0.35em; }
        ol.journey strong { display: block; margin-bottom: 2px; }
        ol.journey span { color: var(--vscode-descriptionForeground, inherit); line-height: 1.45; }
        .trust-note { margin: 0.7em 0 1.5em; padding: 10px 12px; background: var(--vscode-textBlockQuote-background, rgba(127, 127, 127, 0.12)); border-radius: 4px; line-height: 1.45; }
        details { margin-top: 1.6em; border-top: 1px solid var(--vscode-widget-border, rgba(127, 127, 127, 0.35)); border-bottom: 1px solid var(--vscode-widget-border, rgba(127, 127, 127, 0.35)); padding: 12px 0; }
        summary { cursor: pointer; min-height: 32px; padding: 4px 2px; font-weight: 600; }
        summary:focus-visible, button:focus-visible { outline: 2px solid var(--vscode-focusBorder, currentColor); outline-offset: 2px; }
        .technical-detail { margin: 4px 0 16px 22px; color: var(--vscode-descriptionForeground, inherit); }
        ol.commands { list-style: none; margin: 0; padding: 0; }
        li.command { margin-bottom: 1em; }
        .command-heading { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-bottom: 5px; }
        .command-desc { font-weight: 500; }
        .command-meta { color: var(--vscode-descriptionForeground, inherit); font-size: 0.82em; }
        .already-set-up { padding: 8px 10px; border: 1px solid var(--vscode-widget-border, rgba(127, 127, 127, 0.35)); border-radius: 4px; }
        code.command-line { display: block; font-family: var(--vscode-editor-font-family, monospace); font-size: 0.9em; background: var(--vscode-textCodeBlock-background, rgba(127, 127, 127, 0.18)); padding: 8px 11px; border-radius: 4px; white-space: pre-wrap; overflow-wrap: anywhere; }
        .actions { display: flex; gap: 10px; margin-top: 2em; flex-wrap: wrap; }
        button { min-height: 32px; min-width: 32px; font-family: inherit; font-size: 0.95em; padding: 7px 18px; border: 1px solid var(--vscode-contrastBorder, transparent); border-radius: 2px; cursor: pointer; }
        button.primary { background: var(--vscode-button-background, #0078d4); color: var(--vscode-button-foreground, #ffffff); }
        button.primary:hover { background: var(--vscode-button-hoverBackground, #026ec1); }
        button.secondary { background: var(--vscode-button-secondaryBackground, rgba(127, 127, 127, 0.25)); color: var(--vscode-button-secondaryForeground, inherit); }
        button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground, rgba(127, 127, 127, 0.35)); }
        button:disabled { cursor: default; opacity: 0.7; }
        [hidden] { display: none !important; }
        @media (max-width: 480px) {
            dl.summary { grid-template-columns: 1fr; gap: 3px; }
            dl.summary dd { margin-bottom: 10px; }
            .actions { flex-direction: column; align-items: stretch; }
            button { width: 100%; }
        }
        @media (forced-colors: active) {
            .state-panel, dl.summary, details, .already-set-up { border-color: CanvasText; }
            button { border-color: ButtonText; }
        }
        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
        }
    </style>
</head>
<body>
    <main id="main-content">
        <h1>${escapeHtml(title)}</h1>
        <p class="description">${escapeHtml(formatTemplate(confirm.DESCRIPTION, hostDisplayName))}</p>

        <section class="state-panel" id="running-panel" aria-label="${escapeHtml(confirm.RUNNING_STATUS)}" hidden>
            <p id="running-status" role="status" aria-live="polite" aria-atomic="true"
                data-message="${escapeHtml(confirm.RUNNING_STATUS)}"
                data-progress-template="${escapeHtml(confirm.PROGRESS_STATUS)}"
                data-skipped-template="${escapeHtml(confirm.SKIPPED_STATUS)}"></p>
        </section>
        <section class="state-panel" id="handoff-panel" aria-labelledby="handoff-title" hidden>
            <h2 id="handoff-title">${escapeHtml(confirm.HANDOFF_TITLE)}</h2>
            <p id="handoff-status" role="status" aria-live="polite" aria-atomic="true"
                data-message="${escapeHtml(confirm.HANDOFF_DETAIL)}"></p>
        </section>
        <section class="state-panel recovery" id="recovery-panel" aria-labelledby="recovery-title" hidden>
            <h2 id="recovery-title">${escapeHtml(confirm.RECOVERY_TITLE)}</h2>
            <p id="recovery-status" role="alert" aria-live="assertive" aria-atomic="true"></p>
        </section>

        <section aria-labelledby="summary-title">
            <h2 class="section-header" id="summary-title">${escapeHtml(confirm.SUMMARY_HEADER)}</h2>
            <dl class="summary">
                <dt>${escapeHtml(confirm.FOLDER_LABEL)}</dt>
                <dd><span class="summary-primary">${escapeHtml(folderName)}</span><span class="summary-secondary">${escapeHtml(folderPath)}</span></dd>
                <dt>${escapeHtml(confirm.HOST_LABEL)}</dt><dd>${escapeHtml(hostDisplayName)}</dd>
                <dt>${escapeHtml(confirm.SETUP_LABEL)}</dt><dd>${escapeHtml(setupSummary)}</dd>
            </dl>
        </section>

        <section aria-labelledby="next-title">
            <h2 class="section-header" id="next-title">${escapeHtml(confirm.WHAT_NEXT_HEADER)}</h2>
            <ol class="journey">
                <li><strong>${escapeHtml(confirm.PREPARE_ASSISTANT_TITLE)}</strong><span>${escapeHtml(assistantDetail)}</span></li>
                <li><strong>${escapeHtml(confirm.CHECK_GUIDANCE_TITLE)}</strong><span>${escapeHtml(confirm.CHECK_GUIDANCE_DETAIL)}</span></li>
                <li><strong>${escapeHtml(confirm.START_SITE_TITLE)}</strong><span>${escapeHtml(confirm.START_SITE_DETAIL)}</span></li>
            </ol>
        </section>

        <aside class="trust-note" role="note">${escapeHtml(confirm.TRUST_NOTE)}</aside>

        <details id="technical-details">
            <summary>${escapeHtml(confirm.SEQUENCE_HEADER)}</summary>
            <p class="technical-detail">${escapeHtml(confirm.SEQUENCE_DETAIL)}</p>
            <ol class="commands">${alreadySetupItems}${commandItems}</ol>
        </details>

        <div class="actions">
            <button class="primary" id="start" title="${escapeHtml(confirm.START_DETAIL)}">${escapeHtml(confirm.START_LABEL)}</button>
            ${allowEdit ? `<button class="secondary" id="edit" title="${escapeHtml(confirm.EDIT_DETAIL)}">${escapeHtml(confirm.EDIT_LABEL)}</button>` : ""}
            <button class="secondary" id="cancel" title="${escapeHtml(confirm.CANCEL_DETAIL)}">${escapeHtml(confirm.CANCEL_LABEL)}</button>
            <button class="primary" id="go-to-terminal" title="${escapeHtml(confirm.GO_TO_TERMINAL_DETAIL)}" hidden>${escapeHtml(confirm.GO_TO_TERMINAL_LABEL)}</button>
            <button class="primary" id="retry" title="${escapeHtml(confirm.TRY_AGAIN_DETAIL)}" hidden>${escapeHtml(confirm.TRY_AGAIN_LABEL)}</button>
            <button class="secondary" id="setup-options" title="${escapeHtml(confirm.SETUP_OPTIONS_DETAIL)}" hidden>${escapeHtml(confirm.SETUP_OPTIONS_LABEL)}</button>
            <button class="secondary" id="close" title="${escapeHtml(confirm.CLOSE_DETAIL)}" hidden>${escapeHtml(confirm.CLOSE_LABEL)}</button>
        </div>
    </main>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const startButton = document.getElementById("start");
        const editButton = document.getElementById("edit");
        const cancelButton = document.getElementById("cancel");
        const goToTerminalButton = document.getElementById("go-to-terminal");
        const retryButton = document.getElementById("retry");
        const setupOptionsButton = document.getElementById("setup-options");
        const closeButton = document.getElementById("close");
        const runningPanel = document.getElementById("running-panel");
        const runningStatus = document.getElementById("running-status");
        const handoffPanel = document.getElementById("handoff-panel");
        const handoffStatus = document.getElementById("handoff-status");
        const recoveryPanel = document.getElementById("recovery-panel");
        const recoveryStatus = document.getElementById("recovery-status");
        const technicalDetails = document.getElementById("technical-details");
        let launchedStateShown = false;

        function saveState(patch) {
            vscode.setState({ ...(vscode.getState() ?? {}), ...patch });
        }

        function format(template, values) {
            return values.reduce(
                (result, value, index) => result.split("{" + index + "}").join(value),
                template
            );
        }

        function showOnlyState(panel) {
            runningPanel.hidden = panel !== runningPanel;
            handoffPanel.hidden = panel !== handoffPanel;
            recoveryPanel.hidden = panel !== recoveryPanel;
        }

        function showStartedState(shouldFocus, shouldPersist) {
            startButton.disabled = true;
            editButton?.setAttribute("disabled", "");
            cancelButton.hidden = true;
            goToTerminalButton.hidden = true;
            retryButton.hidden = true;
            setupOptionsButton.hidden = true;
            closeButton.hidden = false;
            recoveryStatus.textContent = "";
            showOnlyState(runningPanel);
            runningStatus.textContent = runningStatus.dataset.message;
            if (shouldPersist) {
                saveState({ state: "running" });
            }
            if (shouldFocus) {
                closeButton.focus();
            }
        }

        function showProgressState(message, shouldPersist) {
            showStartedState(false, false);
            runningStatus.textContent = message;
            if (shouldPersist) {
                saveState({ state: "running", message });
            }
        }

        function showHandoffState(shouldFocus, shouldPersist) {
            startButton.hidden = true;
            editButton?.setAttribute("hidden", "");
            cancelButton.hidden = true;
            closeButton.hidden = false;
            goToTerminalButton.hidden = false;
            retryButton.hidden = true;
            setupOptionsButton.hidden = true;
            showOnlyState(handoffPanel);
            handoffStatus.textContent = handoffStatus.dataset.message;
            if (shouldPersist) {
                saveState({ state: "launched" });
            }
            if (shouldFocus) {
                goToTerminalButton.focus();
            }
        }

        function showRecoveryState(message, setupOptionsAvailable, shouldPersist) {
            startButton.disabled = true;
            editButton?.setAttribute("disabled", "");
            cancelButton.hidden = true;
            goToTerminalButton.hidden = true;
            retryButton.hidden = false;
            setupOptionsButton.hidden = !setupOptionsAvailable;
            closeButton.hidden = false;
            showOnlyState(recoveryPanel);
            recoveryStatus.textContent = message;
            technicalDetails.open = true;
            if (shouldPersist) {
                saveState({
                    state: "recovery",
                    message,
                    setupOptionsAvailable,
                    technicalDetailsOpen: true
                });
            }
            retryButton.focus();
        }

        startButton.addEventListener("click", () => {
            if (!startButton.disabled) {
                showStartedState(true, true);
                vscode.postMessage({ decision: "start" });
            }
        });
        editButton?.addEventListener("click", () => vscode.postMessage({ decision: "edit" }));
        cancelButton.addEventListener("click", () => vscode.postMessage({ decision: "cancel" }));
        goToTerminalButton.addEventListener("click", () => vscode.postMessage({ action: "goToTerminal" }));
        retryButton.addEventListener("click", () => vscode.postMessage({ action: "retry" }));
        setupOptionsButton.addEventListener("click", () => vscode.postMessage({ action: "fallback" }));
        closeButton.addEventListener("click", () => vscode.postMessage({ action: "close" }));
        technicalDetails.addEventListener("toggle", (event) => {
            saveState({ technicalDetailsOpen: technicalDetails.open });
            if (technicalDetails.open && event.isTrusted) {
                vscode.postMessage({ action: "technicalDetailsExpanded" });
            }
        });

        window.addEventListener("message", (event) => {
            const message = event.data;
            if (message?.type !== "agenticCreateConfirmState") {
                return;
            }
            if (message.state === "progress" && typeof message.description === "string") {
                const status = message.status === "skipped"
                    ? format(runningStatus.dataset.skippedTemplate, [message.description])
                    : format(runningStatus.dataset.progressTemplate, [
                        String(message.step),
                        String(message.totalSteps),
                        message.description
                    ]);
                showProgressState(status, true);
            } else if (message.state === "launched") {
                showHandoffState(!launchedStateShown, true);
                launchedStateShown = true;
            } else if (message.state === "recovery" && typeof message.message === "string") {
                showRecoveryState(
                    message.message,
                    Boolean(message.setupOptionsAvailable),
                    true
                );
            }
        });

        const persistedState = vscode.getState();
        technicalDetails.open = Boolean(persistedState?.technicalDetailsOpen);
        if (persistedState?.state === "running") {
            showProgressState(persistedState.message ?? runningStatus.dataset.message, false);
        } else if (persistedState?.state === "launched") {
            showHandoffState(false, false);
            launchedStateShown = true;
        } else if (persistedState?.state === "recovery"
            && typeof persistedState.message === "string") {
            showRecoveryState(
                persistedState.message,
                Boolean(persistedState.setupOptionsAvailable),
                false
            );
        }
    </script>
</body>
</html>`;
}

/**
 * Builds the minimal document used to retire a confirmation panel restored after a window reload.
 *
 * The ready message is intentionally sent from inside the webview. Receiving it proves that VS
 * Code has finished initializing the webview host and its service worker, so the extension can
 * dispose the obsolete panel without tearing down a document whose service worker is still being
 * registered.
 */
function buildRestoredPanelCleanupHtml(): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="${escapeHtml(vscode.env.language)}">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.PANEL_TITLE)}</title>
</head>
<body>
    <script nonce="${nonce}">
        acquireVsCodeApi().postMessage({ type: "${RESTORED_PANEL_READY_MESSAGE}" });
    </script>
</body>
</html>`;
}

/**
 * Registers the serializer VS Code uses when it restores a confirmation panel after a window
 * reload, and discards the restored panel.
 *
 * The panel only carries meaning while the promise returned by
 * {@link showAgenticCreateConfirmPanel} is awaiting a decision. A window reload ends that promise
 * along with its message and dispose listeners, so a restored tab can never resolve anything and
 * its buttons post to a listener that no longer exists. The serializer first loads a minimal
 * cleanup document and waits for its ready message before disposing the panel. Disposing directly
 * from `deserializeWebviewPanel` races VS Code's service-worker registration and can leave the tab
 * showing "Could not register service worker: The document is in an invalid state."
 *
 * @returns A disposable that unregisters the serializer.
 */
export function registerAgenticCreateConfirmPanelSerializer(): vscode.Disposable {
    return vscode.window.registerWebviewPanelSerializer(
        URI_CONSTANTS.AGENTIC_CREATE_CONFIRM_VIEW_TYPE,
        {
            async deserializeWebviewPanel(panel: vscode.WebviewPanel): Promise<void> {
                panel.webview.options = {
                    enableScripts: true,
                    localResourceRoots: []
                };

                let disposed = false;
                const disposePanel = (): void => {
                    if (!disposed) {
                        disposed = true;
                        panel.dispose();
                    }
                };
                const fallbackTimer = setTimeout(
                    disposePanel,
                    RESTORED_PANEL_DISPOSE_TIMEOUT_MS
                );
                const messageSubscription = panel.webview.onDidReceiveMessage(
                    (message: { type?: unknown }) => {
                        if (message?.type === RESTORED_PANEL_READY_MESSAGE) {
                            disposePanel();
                        }
                    }
                );
                panel.onDidDispose(() => {
                    disposed = true;
                    clearTimeout(fallbackTimer);
                    messageSubscription.dispose();
                });
                panel.webview.html = buildRestoredPanelCleanupHtml();
            }
        }
    );
}

/**
 * Shows the confirmation gate as a non-blocking webview panel (an editor tab) that both PREVIEWS
 * the exact command plan and collects the decision.
 *
 * Chosen over a QuickPick or modal because it:
 *   - renders the exact command lines faithfully (monospace, wrapping, no truncation, and
 *     selectable/copyable) — unlike a QuickPick `detail`;
 *   - separates read-only content from actions with no misleading no-op rows;
 *   - stays open when the user clicks elsewhere (a tab isn't dismissed on focus loss), and is
 *     non-blocking (not a modal dialog);
 *   - requires an explicit button click, so there is no destructive default that a stray Enter
 *     could trigger.
 *
 * No terminal is created and nothing runs here — the caller launches the agent only when this
 * resolves `"start"`, using the same {@link PlannedCommand} array that was previewed. After Start,
 * the panel remains open with the action disabled so the command lines stay available for manual
 * recovery when a bootstrap step fails.
 *
 * @param hostDisplayName Agent host display name (e.g. "GitHub Copilot CLI").
 * @param folderPath Absolute path of the selected target folder.
 * @param plan Ordered command plan to preview and, on approval, run.
 * @param deps Optional injected side effects.
 * @param allowEdit Whether folder/host selection can be reopened by the caller.
 * @param setupState Existing marketplace and plugin setup discovered before confirmation.
 * @param hostNeedsInstall Whether the selected assistant must be installed first.
 * @param onTechnicalDetailsExpanded Called once when the user first opens Technical details.
 * @returns The active panel session, including the user's decision and recovery-state updater.
 */
export function showAgenticCreateConfirmPanel(
    hostDisplayName: string,
    folderPath: string,
    plan: PlannedCommand[],
    deps: ShowConfirmPanelDependencies = DEFAULT_CONFIRM_PANEL_DEPENDENCIES,
    allowEdit = true,
    setupState: AgentHostSetupState = UNKNOWN_AGENT_HOST_SETUP,
    hostNeedsInstall = false,
    onTechnicalDetailsExpanded?: () => void
): AgenticCreateConfirmPanelSession {
    const panel = deps.createWebviewPanel(
        URI_CONSTANTS.AGENTIC_CREATE_CONFIRM_VIEW_TYPE,
        URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.PANEL_TITLE,
        vscode.ViewColumn.Active,
        { enableScripts: true, retainContextWhenHidden: false }
    );

    panel.webview.html = buildHtml(
        hostDisplayName,
        folderPath,
        plan,
        panel.webview.cspSource,
        allowEdit,
        setupState,
        hostNeedsInstall
    );
    const confirm = URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM;
    const progressStageLabels: Record<MakerProgressStage, string> = {
        prepareAssistant: confirm.PREPARE_ASSISTANT_TITLE,
        checkGuidance: confirm.CHECK_GUIDANCE_TITLE,
        startSite: confirm.START_SITE_TITLE
    };
    const progressStages = [...new Set(
        plan.map(command => MAKER_PROGRESS_STAGE_BY_COMMAND[command.kind])
    )];

    let settleDecision: (decision: ConfirmDecision) => void;
    const decision = new Promise<ConfirmDecision>((resolve) => {
        settleDecision = resolve;
    });

    // Resolve exactly once. Start keeps the panel as a durable command reference; Cancel closes it.
    let settled = false;
    const settleWith = (value: ConfirmDecision): boolean => {
        if (settled) {
            return false;
        }
        settled = true;
        settleDecision(value);
        return true;
    };

    let latestStateMessage: Record<string, unknown> | undefined;
    let launchedTerminal: vscode.Terminal | undefined;
    let technicalDetailsExpanded = false;
    let panelDisposed = false;
    let resolveRecoveryDecision: ((decision: ConfirmRecoveryDecision) => void) | undefined;
    const postLatestState = (): PromiseLike<boolean> => panel.webview.postMessage({
        type: "agenticCreateConfirmState",
        ...latestStateMessage
    });
    panel.onDidChangeViewState(({ webviewPanel }) => {
        if (webviewPanel.visible && latestStateMessage) {
            void postLatestState();
        }
    });

    panel.webview.onDidReceiveMessage((message: { decision?: unknown; action?: unknown }) => {
        if (message?.action === "close") {
            resolveRecoveryDecision?.("cancel");
            resolveRecoveryDecision = undefined;
            panel.dispose();
        } else if (message?.action === "goToTerminal") {
            launchedTerminal?.show();
        } else if (message?.action === "retry") {
            resolveRecoveryDecision?.("retry");
            resolveRecoveryDecision = undefined;
        } else if (message?.action === "fallback") {
            resolveRecoveryDecision?.("fallback");
            resolveRecoveryDecision = undefined;
            panel.dispose();
        } else if (
            message?.action === "technicalDetailsExpanded"
            && !technicalDetailsExpanded
        ) {
            technicalDetailsExpanded = true;
            onTechnicalDetailsExpanded?.();
        } else if (message?.decision === "start") {
            settleWith("start");
        } else if (message?.decision === "edit" || message?.decision === "cancel") {
            if (settleWith(message.decision)) {
                panel.dispose();
            }
        }
    });

    // Closing the tab without choosing an action is a possibly-accidental interruption.
    panel.onDidDispose(() => {
        panelDisposed = true;
        resolveRecoveryDecision?.("cancel");
        resolveRecoveryDecision = undefined;
        settleWith("dismissed");
    });

    return {
        decision,
        showProgress: (progress) => {
            const stage = MAKER_PROGRESS_STAGE_BY_COMMAND[progress.command.kind];
            latestStateMessage = {
                state: "progress",
                description: progressStageLabels[stage],
                step: progressStages.indexOf(stage) + 1,
                totalSteps: progressStages.length,
                status: progress.status
            };
            return postLatestState();
        },
        showLaunched: (result) => {
            launchedTerminal = result.terminal;
            latestStateMessage = { state: "launched" };
            return postLatestState();
        },
        showRecovery: (result) => {
            if (panelDisposed) {
                return Promise.resolve("cancel");
            }
            const setupOptionsAvailable = hostNeedsInstall && (
                result.reason === "shellIntegrationUnavailable"
                || result.failedCommand?.kind === "installHost"
                || result.failedCommand?.kind === "refreshPath"
                || result.failedCommand?.kind === "verifyHost"
            );
            latestStateMessage = {
                state: "recovery",
                message: formatRecoveryStatus(result),
                setupOptionsAvailable
            };
            return new Promise<ConfirmRecoveryDecision>(resolve => {
                resolveRecoveryDecision = resolve;
                void postLatestState();
            });
        }
    };
}
